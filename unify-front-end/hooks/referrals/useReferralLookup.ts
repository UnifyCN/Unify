import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/context/UserContext';

export interface InviterInfo {
  id: string;
  username: string;
  profile_picture_url: string | null;
  city: string | null;
}

export interface ReferralLookup {
  hasReferral: boolean;
  inviter: InviterInfo | null;
}

/**
 * Welcome screen reads this to render the "You are here because of {inviter}" card.
 * Returns { hasReferral: false } when there is no referral row OR when the inviter
 * was deleted (inviter_id IS NULL via ON DELETE SET NULL).
 *
 * The Welcome screen falls back to a generic "Welcome to Unify!" copy if hasReferral
 * is false or inviter is null.
 */
export function useReferralLookup() {
  const { currentUser } = useCurrentUser();
  const userId = currentUser?.id ?? null;

  return useQuery<ReferralLookup, Error>({
    queryKey: ['referral-lookup', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!userId) throw new Error('not authenticated');

      const { data: row, error } = await supabase
        .from('referrals')
        .select('inviter_id')
        .eq('invitee_id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }
      if (!row || !row.inviter_id) {
        return { hasReferral: false, inviter: null };
      }

      const [{ data: user }, { data: profile }] = await Promise.all([
        supabase
          .from('users')
          .select('id, username, profile_picture_url')
          .eq('id', row.inviter_id)
          .maybeSingle(),
        supabase
          .from('user_onboarding_profiles')
          .select('city')
          .eq('id', row.inviter_id)
          .maybeSingle(),
      ]);

      if (!user) {
        return { hasReferral: true, inviter: null };
      }

      return {
        hasReferral: true,
        inviter: {
          id: user.id,
          username: user.username ?? 'a friend',
          profile_picture_url:
            (user as { profile_picture_url?: string | null }).profile_picture_url ?? null,
          city: profile?.city ?? null,
        },
      };
    },
  });
}
