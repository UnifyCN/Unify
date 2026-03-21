import { supabase } from '@/lib/supabase';
import { buildPoolKey, type MatchingTimeInCanada } from '@/matching/pools';
import type { Persona } from '@/types/onboardingProfile';
import type { CommunityWaitlistEntry } from '@/types/matching';

export const getCurrentWaitlistEntry =
  async (): Promise<CommunityWaitlistEntry | null> => {
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

    if (!data) {
      return null;
    }

    const row = data as Partial<CommunityWaitlistEntry> & {
      placement_deadline_at?: string | null;
      topics?: string[] | null;
      created_at: string;
    };

    return {
      ...(row as CommunityWaitlistEntry),
      goal: row.goal ?? null,
      topics: row.topics || [],
      placement_deadline_at:
        row.placement_deadline_at ||
        new Date(
          new Date(row.created_at).getTime() + 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
    };
  };

interface JoinWaitlistParams {
  persona: Persona | null;
  timeInCanada: MatchingTimeInCanada;
  goal: string | null;
  topics: string[];
}

export const joinCommunityWaitlist = async ({
  persona,
  timeInCanada,
  goal,
  topics,
}: JoinWaitlistParams) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const poolKey = buildPoolKey(persona, timeInCanada);

  const { error } = await supabase.rpc('join_community_waitlist', {
    _persona: persona,
    _time_in_canada: timeInCanada,
    _pool_key: poolKey,
    _goal: goal,
    _topics: topics,
  });

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
