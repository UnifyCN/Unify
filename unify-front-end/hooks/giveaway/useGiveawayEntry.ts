import { useQuery } from '@tanstack/react-query';

import { getUserEntry } from '@/services/giveaway/getUserEntry';
import { GIVEAWAY } from '@/constants/Giveaway';
import { useCurrentUser } from '@/context/UserContext';

export const GIVEAWAY_ENTRY_QUERY_KEY = [
  'giveaway-entry',
  GIVEAWAY.campaignId,
] as const;

/**
 * React Query for the current user's entry in the active campaign.
 *
 *   data === null    → user has not entered (banner shows entry CTA)
 *   data !== null    → user has entered (banner shows "entered" state)
 *
 * The query is gated on `currentUser` so we don't fire before auth resolves.
 * On success, results are cached for 5 minutes — entries are immutable from
 * the user's side (no update/delete policies), so re-fetching is unnecessary.
 */
export function useGiveawayEntry() {
  const { currentUser } = useCurrentUser();

  return useQuery({
    queryKey: GIVEAWAY_ENTRY_QUERY_KEY,
    queryFn: getUserEntry,
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
