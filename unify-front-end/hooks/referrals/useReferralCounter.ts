import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/context/UserContext';

export interface ReferralCounter {
  invited: number; // total people we have invited (referrals where inviter_id = me)
  joined: number;  // those who actually completed onboarding (same row count, since the
                   // referral row is only inserted on successful redeem)
}

/**
 * Counts referrals attributed to the current user.
 *
 *   "You've invited N friends. M have joined."
 *
 * Right now invited === joined because we only ever insert a referrals row on a
 * successful redeem (we don't track sent-but-not-redeemed in the DB). If we later
 * add an invite_sends table, this hook is the one that grows a second query.
 */
export function useReferralCounter() {
  const { currentUser } = useCurrentUser();
  const userId = currentUser?.id ?? null;

  return useQuery<ReferralCounter, Error>({
    queryKey: ['referral-counter', userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!userId) throw new Error('not authenticated');
      const { count, error } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('inviter_id', userId);
      if (error) throw error;
      const joined = count ?? 0;
      return { invited: joined, joined };
    },
  });
}
