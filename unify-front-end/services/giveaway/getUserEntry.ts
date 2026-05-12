import { supabase } from '@/lib/supabase';
import { GIVEAWAY } from '@/constants/Giveaway';
import type { GiveawayEntry } from './types';

/**
 * Returns the current user's entry for the active campaign, or null if they
 * haven't entered. RLS guarantees the result is the caller's own row.
 */
export async function getUserEntry(): Promise<GiveawayEntry | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data, error } = await supabase
    .from('giveaway_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('campaign_id', GIVEAWAY.campaignId)
    .maybeSingle();

  if (error) {
    if (__DEV__) {
      console.error('[giveaway] getUserEntry failed', error);
    }
    return null;
  }

  return data;
}
