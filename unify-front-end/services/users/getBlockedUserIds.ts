import { supabase } from '@/lib/supabase';

/**
 * Fetches blocked user IDs for the current user.
 * Uses a short in-memory cache to avoid redundant queries across feed services.
 */
let cachedIds: string[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

export const getBlockedUserIds = async (): Promise<string[]> => {
  const now = Date.now();
  if (cachedIds && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedIds;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('blocked_users')
    .select('blocked_id')
    .eq('blocker_id', user.id);

  if (error) {
    console.error('Failed to fetch blocked users:', error);
    return cachedIds || [];
  }

  cachedIds = data?.map(row => row.blocked_id) || [];
  cacheTimestamp = now;
  return cachedIds;
};

/** Invalidates the cache so the next call fetches fresh data. */
export const invalidateBlockedUserIds = () => {
  cachedIds = null;
  cacheTimestamp = 0;
};
