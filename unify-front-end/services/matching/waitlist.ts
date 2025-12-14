import { supabase } from '@/lib/supabase';
import { buildPoolKey } from '@/matching/pools';
import type { Persona, TimeInCanada } from '@/types/onboardingProfile';
import type { CommunityWaitlistEntry } from '@/types/matching';

export const getCurrentWaitlistEntry = async (): Promise<
  CommunityWaitlistEntry | null
> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('community_match_waitlist')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to load waitlist entry: ${error.message}`);
  }

  return (data as CommunityWaitlistEntry) ?? null;
};

interface JoinWaitlistParams {
  persona: Persona;
  timeInCanada: TimeInCanada;
}

export const joinCommunityWaitlist = async ({
  persona,
  timeInCanada,
}: JoinWaitlistParams) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const poolKey = buildPoolKey(persona, timeInCanada);

  const { error } = await supabase
    .from('community_match_waitlist')
    .upsert(
      {
        user_id: user.id,
        persona,
        time_in_canada: timeInCanada,
        pool_key: poolKey,
        status: 'waiting',
      },
      { onConflict: 'user_id', ignoreDuplicates: false }
    );

  if (error) {
    throw new Error(`Failed to enter waitlist: ${error.message}`);
  }
};

export const leaveCommunityWaitlist = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('community_match_waitlist')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to leave waitlist: ${error.message}`);
  }
};
