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

      if (!data || typeof data !== 'object') {
        return { success: false, reason: 'server_error' };
      }

      const payload = data as RedeemResult;
      return payload;
    } catch (err) {
      console.error('redeemReferral attempt failed', { attempt, err });
      if (attempt === 0) continue;
      return { success: false, reason: 'server_error' };
    }
  }

  return { success: false, reason: 'server_error' };
}
