import { useQuery } from '@tanstack/react-query';

import { getUserEntry } from '@/services/giveaway/getUserEntry';
import { GIVEAWAY } from '@/constants/Giveaway';
import { useCurrentUser } from '@/context/UserContext';

/**
 * Query-key factory. The campaign id alone isn't enough — caching is per
 * (campaign, user), otherwise a sign-out → sign-in as a different user on
 * the same device would briefly return the previous user's cached entry
 * before the next refetch.
 */
export const giveawayEntryQueryKey = (userId: string | null | undefined) =>
  ['giveaway-entry', GIVEAWAY.campaignId, userId ?? 'anon'] as const;

/**
 * Convenience: a partial key for invalidating ALL giveaway-entry caches for
 * the current campaign regardless of user. Use this in mutations where you
 * just want React Query to refetch whatever the current user's key is.
 */
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
    queryKey: giveawayEntryQueryKey(currentUser?.id),
    queryFn: getUserEntry,
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
