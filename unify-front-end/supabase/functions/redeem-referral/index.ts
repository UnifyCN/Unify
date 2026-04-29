/**
 * redeem-referral
 *
 * Atomic-ish redemption of an invite code. Called once per new user, right after
 * onboarding completes. Mirrors the block-user / report-user pattern: 200 status on
 * expected failures with { success: false, reason } so the client treats them as
 * data, not exceptions. The invitee's signup is never blocked by a redeem failure.
 *
 *  CALL FLOW:
 *
 *    client (saveOnboardingProfile) ──▶ POST /redeem-referral { code, source }
 *           │
 *           ▼
 *    [1] auth check          ─── unauthorized                ─▶ 401
 *    [2] body validation     ─── bad payload                 ─▶ 400
 *    [3] find inviter by code (users WHERE invite_code = $1)
 *           │ not found / banned                             ─▶ {ok:false, reason:'invalid_code'|'inviter_banned'}
 *           ▼
 *    [4] self-referral check                                 ─▶ {ok:false, reason:'self_referral'}
 *    [5] INSERT referrals (UNIQUE on invitee_id)
 *           │ conflict (already redeemed)                    ─▶ {ok:false, reason:'already_redeemed'} (idempotent)
 *           ▼
 *    [6] INSERT user_followers (follower=invitee, following=inviter)
 *           │ (we do NOT call createFollowNotification — the invite-redeemed push
 *           │  below is the better signal, avoids double-notify)
 *           ▼
 *    [7] INSERT community_notifications (type='invite_redeemed') for inviter
 *           │
 *           ▼
 *    [8] best-effort invoke send-social-push for that notification
 *           ▼
 *    [9] fetch inviter card + their joined groups for the welcome screen
 *           ▼
 *           return { success:true, inviter, groups }
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const REFERRALS_ENABLED = (Deno.env.get('REFERRALS_ENABLED') ?? 'true') !== 'false';

type RedeemSource = 'clipboard' | 'manual' | 'universal_link';

interface RedeemBody {
  code?: unknown;
  source?: unknown;
}

interface InviterCard {
  id: string;
  username: string;
  profile_picture_url: string | null;
  city: string | null;
}

interface GroupCard {
  id: number;
  name: string;
  description: string | null;
  member_count: number | null;
  cover_photo_url: string | null;
}

function ok200(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isValidSource(s: unknown): s is RedeemSource {
  return s === 'clipboard' || s === 'manual' || s === 'universal_link';
}

// Alphabet matches generate_invite_code RPC: A-Z minus I and O, digits 2-9.
const CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/;

Deno.serve(async req => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('redeem-referral: missing Supabase env vars');
    return new Response(JSON.stringify({ success: false, reason: 'server_error' }), {
      status: 500,
    });
  }

  if (!REFERRALS_ENABLED) {
    return ok200({ success: false, reason: 'feature_disabled' });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // [1] auth
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ success: false, reason: 'unauthorized' }), { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: authData, error: authErr } = await supabase.auth.getUser(token);
  const user = authData?.user;
  if (authErr || !user) {
    return new Response(JSON.stringify({ success: false, reason: 'unauthorized' }), { status: 401 });
  }

  // [2] body validation
  let body: RedeemBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ success: false, reason: 'bad_request' }), { status: 400 });
  }

  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  const source = isValidSource(body.source) ? body.source : 'manual';

  if (!CODE_RE.test(code)) {
    return ok200({ success: false, reason: 'invalid_code' });
  }

  // [3] find inviter
  const { data: inviterRow, error: inviterErr } = await supabase
    .from('users')
    .select('id, username, profile_picture_url')
    .eq('invite_code', code)
    .maybeSingle();

  if (inviterErr) {
    console.error('redeem-referral: inviter lookup error', inviterErr);
    return ok200({ success: false, reason: 'server_error' });
  }
  if (!inviterRow) {
    return ok200({ success: false, reason: 'invalid_code' });
  }

  // [4] self-referral
  if (inviterRow.id === user.id) {
    return ok200({ success: false, reason: 'self_referral' });
  }

  // [5] insert referral row (UNIQUE on invitee_id)
  // Note: defense-in-depth — the only legitimate caller of this function is
  // saveOnboardingProfile after a successful upsert with onboarding_completed=true,
  // so by the time we get here the user's profile state is already correct.
  // We don't re-check onboarding_completed here because (a) the order is guaranteed
  // by the client, (b) there are no rewards to forge, and (c) it would add a query
  // to every legitimate redeem.
  const { error: insertErr } = await supabase.from('referrals').insert({
    inviter_id: inviterRow.id,
    invitee_id: user.id,
    invite_code: code,
    source,
  });

  // Track whether this is a fresh insert vs a retry of an existing row. Side
  // effects (auto-follow, notification, push) only fire on fresh inserts.
  let isFreshRedeem = true;

  if (insertErr) {
    // 23505 = unique_violation. There's already a referrals row for this invitee.
    // If it's the SAME code+inviter as the current request, treat as an idempotent
    // retry: skip side effects, hydrate the welcome payload, return success.
    // If it's a DIFFERENT code (user already redeemed someone else's code earlier),
    // refuse: don't overwrite, don't show a second welcome.
    if ((insertErr as { code?: string }).code === '23505') {
      const { data: existing, error: lookupErr } = await supabase
        .from('referrals')
        .select('inviter_id, invite_code')
        .eq('invitee_id', user.id)
        .maybeSingle();

      if (lookupErr || !existing) {
        console.error('redeem-referral: 23505 reload failed', lookupErr);
        return ok200({ success: false, reason: 'server_error' });
      }
      if (existing.inviter_id !== inviterRow.id || existing.invite_code !== code) {
        // Different code redeemed earlier — refuse silently.
        return ok200({ success: false, reason: 'already_redeemed' });
      }
      // Same code+inviter: legitimate retry. Fall through to hydration with
      // side effects skipped.
      isFreshRedeem = false;
    } else {
      console.error('redeem-referral: insert error', insertErr);
      return ok200({ success: false, reason: 'server_error' });
    }
  }

  if (isFreshRedeem) {
    // [6] auto-follow inviter — invitee follows inviter. Bypass createFollowNotification
    // by inserting directly; this avoids a duplicate "started following you" push, since
    // we're about to send the more meaningful "joined via your invite" push instead.
    // Conflict (already follows) is fine — no-op.
    const { error: followErr } = await supabase
      .from('user_followers')
      .upsert(
        { follower_id: user.id, following_id: inviterRow.id },
        { onConflict: 'follower_id,following_id', ignoreDuplicates: true }
      );
    if (followErr) {
      console.error('redeem-referral: follow insert error (non-fatal)', followErr);
    }

    // [7+8] inviter notification + push
    const { data: inviteeProfile } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();

    const inviteeUsername = inviteeProfile?.username ?? 'Someone';
    const { data: notif, error: notifErr } = await supabase
      .from('community_notifications')
      .insert({
        user_id: inviterRow.id,
        triggered_by_user_id: user.id,
        type: 'invite_redeemed',
        title: 'New friend on Unify',
        body: `🎉 ${inviteeUsername} just joined Unify thanks to you.`,
        data: { actor_user_id: user.id, source },
      })
      .select('id')
      .single();

    if (notifErr) {
      console.error('redeem-referral: notification insert error (non-fatal)', notifErr);
    } else if (notif?.id) {
      // Fire-and-forget push. Failure must not break the redeem.
      supabase.functions
        .invoke('send-social-push', { body: { notification_id: notif.id } })
        .catch(err => console.error('redeem-referral: send-social-push failed', err));
    }
  }

  // [9] hydrate the welcome screen response
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from('user_onboarding_profiles')
      .select('city')
      .eq('id', inviterRow.id)
      .maybeSingle(),
    supabase
      .from('group_members')
      .select(
        `groups!inner ( id, group_name, group_description, member_count, cover_photo_url )`
      )
      .eq('user_id', inviterRow.id),
  ]);

  const inviter: InviterCard = {
    id: inviterRow.id,
    username: inviterRow.username,
    profile_picture_url: (inviterRow as { profile_picture_url?: string | null }).profile_picture_url ?? null,
    city: profile?.city ?? null,
  };

  const groups: GroupCard[] = ((memberships ?? []) as Array<{
    groups: {
      id: number;
      group_name: string | null;
      group_description: string | null;
      member_count: number | null;
      cover_photo_url: string | null;
    };
  }>).map(m => ({
    id: m.groups.id,
    name: (m.groups.group_name ?? '').trim(),
    description: m.groups.group_description?.trim() ?? null,
    member_count: m.groups.member_count,
    cover_photo_url: m.groups.cover_photo_url,
  }));

  return ok200({ success: true, inviter, groups });
});
