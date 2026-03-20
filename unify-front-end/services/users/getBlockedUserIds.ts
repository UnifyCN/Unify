import { supabase } from '@/lib/supabase';

/**
 * Fetches blocked user IDs for the current user.
 * Uses a short in-memory cache keyed by user ID to avoid redundant queries
 * across feed services and prevent stale data after user switches.
 */
const CACHE_TTL_MS = 30_000; // 30 seconds
const cache = new Map<string, { ids: string[]; timestamp: number }>();

export const getBlockedUserIds = async (): Promise<string[]> => {
  return getBlockedUserIdsForUser();
};

export const getBlockedUserIdsForUser = async (
  userId?: string | null
): Promise<string[]> => {
  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];
    resolvedUserId = user.id;
  }

  const now = Date.now();
  const entry = cache.get(resolvedUserId);
  if (entry && now - entry.timestamp < CACHE_TTL_MS) {
    return entry.ids;
  }

  const { data, error } = await supabase
    .from('blocked_users')
    .select('blocked_id')
    .eq('blocker_id', resolvedUserId);

  if (error) {
    console.error('Failed to fetch blocked users:', error);
    return entry?.ids || [];
  }

  const ids = data?.map(row => row.blocked_id) || [];
  cache.set(resolvedUserId, { ids, timestamp: now });
  return ids;
};

/** Invalidates the cache so the next call fetches fresh data. */
export const invalidateBlockedUserIds = () => {
  cache.clear();
};
