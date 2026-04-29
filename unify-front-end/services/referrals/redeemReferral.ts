import { supabase } from '@/lib/supabase';

export type RedeemReason =
  | 'invalid_code'
  | 'self_referral'
  | 'already_redeemed'
  | 'inviter_not_found'
  | 'inviter_banned'
  | 'feature_disabled'
  | 'unauthorized'
  | 'bad_request'
  | 'server_error';

export interface RedeemInviter {
  id: string;
  username: string;
  profile_picture_url: string | null;
  city: string | null;
}

export interface RedeemGroup {
  id: number;
  name: string;
  description: string | null;
  member_count: number | null;
  cover_photo_url: string | null;
}

export type RedeemResult =
  | { success: true; inviter: RedeemInviter; groups: RedeemGroup[] }
  | { success: false; reason: RedeemReason };

const VALID_REASONS: ReadonlySet<RedeemReason> = new Set([
  'invalid_code',
  'self_referral',
  'already_redeemed',
  'inviter_not_found',
  'inviter_banned',
  'feature_disabled',
  'unauthorized',
  'bad_request',
  'server_error',
]);

function isInviter(v: unknown): v is RedeemInviter {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.username === 'string' &&
    (r.profile_picture_url === null || typeof r.profile_picture_url === 'string') &&
    (r.city === null || typeof r.city === 'string')
  );
}

function isGroup(v: unknown): v is RedeemGroup {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === 'number' &&
    typeof r.name === 'string' &&
    (r.description === null || typeof r.description === 'string') &&
    (r.member_count === null || typeof r.member_count === 'number') &&
    (r.cover_photo_url === null || typeof r.cover_photo_url === 'string')
  );
}

/** Validate the edge-function JSON before trusting it as a RedeemResult. */
function validateRedeemResponse(data: unknown): RedeemResult | null {
  if (!data || typeof data !== 'object') return null;
  const r = data as Record<string, unknown>;

  if (r.success === true) {
    if (!isInviter(r.inviter)) return null;
    if (!Array.isArray(r.groups) || !r.groups.every(isGroup)) return null;
    return { success: true, inviter: r.inviter, groups: r.groups };
  }
  if (r.success === false) {
    if (typeof r.reason !== 'string' || !VALID_REASONS.has(r.reason as RedeemReason)) {
      return null;
    }
    return { success: false, reason: r.reason as RedeemReason };
  }
  return null;
}

export async function redeemReferral(
  code: string,
  source: 'clipboard' | 'manual'
): Promise<RedeemResult> {
  const normalized = code.trim().toUpperCase();

  // One automatic retry on server_error / network failure. After that, give up
  // gracefully — referral failure must never block onboarding completion.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke('redeem-referral', {
        body: { code: normalized, source },
      });

      if (error) {
        // Supabase wraps non-2xx responses as errors. Fall through to retry on first
        // attempt; treat as server_error on the second.
        if (attempt === 0) continue;
        return { success: false, reason: 'server_error' };
      }

      const validated = validateRedeemResponse(data);
      if (!validated) {
        return { success: false, reason: 'server_error' };
      }
      return validated;
    } catch (err) {
      console.error('redeemReferral attempt failed', { attempt, err });
      if (attempt === 0) continue;
      return { success: false, reason: 'server_error' };
    }
  }

  return { success: false, reason: 'server_error' };
}
