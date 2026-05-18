// supabase/functions/pick-interview-candidates/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend';
import { fetchActiveUsers14d } from '../_shared/interview/posthog.ts';
import { pickCandidates } from '../_shared/interview/selection.ts';
import { signToken } from '../_shared/interview/tokens.ts';
import {
  renderOutboundEmail,
  renderApprovalEmail,
  type ApprovalCandidate,
} from '../_shared/interview/email-templates.ts';

const SUPABASE_URL                = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const POSTHOG_HOST                = Deno.env.get('POSTHOG_HOST') ?? 'https://us.i.posthog.com';
const POSTHOG_PROJECT_ID          = Deno.env.get('POSTHOG_PROJECT_ID')!;
const POSTHOG_API_KEY             = Deno.env.get('POSTHOG_API_KEY')!;
const INTERVIEW_SIGNING_SECRET    = Deno.env.get('INTERVIEW_SIGNING_SECRET')!;
const RESEND_USER_EMAILS_API_KEY  = Deno.env.get('RESEND_USER_EMAILS_API_KEY')!;
const RESEND_INTERVIEW_FROM       = Deno.env.get('RESEND_INTERVIEW_FROM') ?? 'Savar from Unify <contact@unifysocial.ca>';
const APPROVAL_EMAIL_RECIPIENT    = Deno.env.get('APPROVAL_EMAIL_RECIPIENT')!;
const SAVAR_USER_ID               = Deno.env.get('SAVAR_USER_ID')!;
const CAL_COM_LINK                = Deno.env.get('CAL_COM_LINK')!;
const BUSINESS_ADDRESS            = Deno.env.get('BUSINESS_ADDRESS')!;
const FUNCTIONS_BASE_URL          = `${SUPABASE_URL}/functions/v1`;
const DRY_RUN                     = Deno.env.get('INTERVIEW_DRY_RUN') === 'true';

const COOLDOWN_DAYS = 12 * 7;       // 12 weeks
const EXPIRE_AFTER_DAYS = 6;        // pending_approval older than 6 days → expired
const MAX_PICKS = 3;

Deno.serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const resend = new Resend(RESEND_USER_EMAILS_API_KEY);

  try {
    // 1. Expire stale pending_approval rows
    await supabase
      .from('interview_invites')
      .update({ status: 'expired' })
      .eq('status', 'pending_approval')
      .lt('picked_at', new Date(Date.now() - EXPIRE_AFTER_DAYS * 86400_000).toISOString());

    // 2. Missed-run detection (compute warning before picking)
    const { data: lastRows } = await supabase
      .from('interview_invites')
      .select('picked_at')
      .order('picked_at', { ascending: false })
      .limit(1);
    let warning: string | null = null;
    if (lastRows?.[0]?.picked_at) {
      const last = new Date(lastRows[0].picked_at).getTime();
      const daysSince = (Date.now() - last) / 86400_000;
      if (daysSince > 8) {
        warning = `Last successful pick was ${Math.floor(daysSince)} days ago — previous run may have failed silently`;
      }
    }

    // 3. Fetch eligible users from PostHog
    const allActive = await fetchActiveUsers14d({
      posthogHost: POSTHOG_HOST,
      projectId:   POSTHOG_PROJECT_ID,
      apiKey:      POSTHOG_API_KEY,
    });

    // 4. Resolve to Supabase user via email (PostHog person_id is PostHog-internal,
    //    NOT auth.users.id — the only stable cross-system key is email).
    //    Re-key each ActiveUser.personId to the resolved auth.users.id so all
    //    downstream code (inserts, cooldown, tokens) speaks Supabase ids.
    const emails = allActive.map(u => u.email);
    const { data: validUsers } = await supabase
      .from('users')
      .select('id, email, do_not_contact, created_at')
      .in('email', emails);
    const emailMeta = new Map<string, { id: string; createdAt: string }>();
    for (const u of validUsers ?? []) {
      if (u.do_not_contact || !u.email) continue;
      emailMeta.set(u.email as string, {
        id: u.id as string,
        createdAt: u.created_at as string,
      });
    }
    const eligible = allActive
      .filter(u => emailMeta.has(u.email))
      .map(u => ({ ...u, personId: emailMeta.get(u.email)!.id }));

    // 5. Cooldown exclusion set
    const { data: cooldownRows } = await supabase
      .from('interview_invites')
      .select('user_id')
      .in('status', ['approved', 'sent', 'booked'])
      .gte('picked_at', new Date(Date.now() - COOLDOWN_DAYS * 86400_000).toISOString());
    const excludeUserIds = new Set<string>(
      (cooldownRows ?? []).map(r => r.user_id as string),
    );
    excludeUserIds.add(SAVAR_USER_ID);

    // 6. Tier + pick
    const picks = pickCandidates(eligible, { max: MAX_PICKS, excludeUserIds });

    // 7. Pipeline health (for the approval email footer)
    const cTierCount = eligible.filter(u =>
      u.surfaces14d >= 3 || u.companionMsgs14d >= 5
    ).length;
    const bTierCount = eligible.filter(u =>
      !(u.surfaces14d >= 3 || u.companionMsgs14d >= 5) && u.surfaces14d >= 2
    ).length;

    // 8. For each pick: insert row, render outbound preview, build signed URLs
    const approvalCandidates: ApprovalCandidate[] = [];
    for (const pick of picks) {
      const { data: inserted, error: insertErr } = await supabase
        .from('interview_invites')
        .insert({
          user_id:            pick.user.personId,
          email:              pick.user.email,
          name:               pick.user.name,
          tier:               pick.tier,
          surfaces_14d:       pick.user.surfaces14d,
          events_14d:         pick.user.events14d,
          companion_msgs_14d: pick.user.companionMsgs14d,
          status:             'pending_approval',
        })
        .select('id, created_at')
        .single();
      if (insertErr || !inserted) {
        console.error('[interview-picker] insert failed:', insertErr);
        continue;
      }

      // Render outbound preview now so it shows in approval email and can be
      // sent verbatim from the approve handler. Persist subject/body on row.
      const unsubToken = await signToken(pick.user.personId, 'unsubscribe', INTERVIEW_SIGNING_SECRET);
      const unsubUrl = `${FUNCTIONS_BASE_URL}/unsubscribe-interview?u=${pick.user.personId}&t=${unsubToken}`;
      const outbound = renderOutboundEmail({
        recipientName:   pick.user.name,
        calComLink:      CAL_COM_LINK,
        unsubscribeUrl:  unsubUrl,
        businessAddress: BUSINESS_ADDRESS,
      });

      await supabase
        .from('interview_invites')
        .update({
          email_subject: outbound.subject,
          email_body:    outbound.text,  // store plain text; HTML re-rendered at send time
        })
        .eq('id', inserted.id);

      const approveToken = await signToken(inserted.id, 'approve', INTERVIEW_SIGNING_SECRET);
      const skipToken    = await signToken(inserted.id, 'skip',    INTERVIEW_SIGNING_SECRET);

      // user_created_at for display: from cached emailMeta (avoid N+1 query)
      const createdAt = emailMeta.get(pick.user.email)?.createdAt ?? inserted.created_at;

      approvalCandidates.push({
        email:              pick.user.email,
        name:               pick.user.name,
        tier:               pick.tier,
        surfaces14d:        pick.user.surfaces14d,
        events14d:          pick.user.events14d,
        companionMsgs14d:   pick.user.companionMsgs14d,
        userCreatedAt:      formatDate(createdAt),
        emailSubject:       outbound.subject,
        emailBodyExcerpt:   outbound.text.slice(0, 240) + (outbound.text.length > 240 ? '…' : ''),
        approveUrl:         `${FUNCTIONS_BASE_URL}/approve-interview-invite?i=${inserted.id}&t=${approveToken}`,
        skipUrl:            `${FUNCTIONS_BASE_URL}/skip-interview-invite?i=${inserted.id}&t=${skipToken}`,
      });
    }

    // 9. Send the approval email
    const approval = renderApprovalEmail({
      candidates: approvalCandidates,
      pipelineHealth: { cTier: cTierCount, bTier: bTierCount, inCooldown: excludeUserIds.size - 1 /* minus Savar */ },
      warning,
    });

    if (DRY_RUN) {
      console.log('[interview-picker] DRY_RUN — would email', APPROVAL_EMAIL_RECIPIENT, 'subject:', approval.subject);
    } else {
      await resend.emails.send({
        from:     RESEND_INTERVIEW_FROM,
        to:       APPROVAL_EMAIL_RECIPIENT,
        subject:  approval.subject,
        html:     approval.html,
        text:     approval.text,
        replyTo:  'contact@unifysocial.ca',
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      picked: approvalCandidates.length,
      eligible: eligible.length,
      cTier: cTierCount,
      bTier: bTierCount,
      cooldown: excludeUserIds.size - 1,
      warning,
      dryRun: DRY_RUN,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('[interview-picker] error:', err);
    // Send Savar a one-sentence failure notice
    try {
      await resend.emails.send({
        from:    RESEND_INTERVIEW_FROM,
        to:      APPROVAL_EMAIL_RECIPIENT,
        subject: '[Unify Picker] Failure — check logs',
        text:    `The interview picker errored: ${String(err).slice(0, 240)}\n\nSupabase logs: ${SUPABASE_URL.replace('.supabase.co', '.supabase.com')}/project/_/functions`,
      });
    } catch (sendErr) {
      console.error('[interview-picker] failure-notice send also failed:', sendErr);
    }
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}
