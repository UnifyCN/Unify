// hooks/companion/usePersonalizedStarters.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PersonalizedStarter } from '@/supabase/functions/_shared/companionTemplates';

export type { PersonalizedStarter };

export interface CompanionPersonalization {
  starters: PersonalizedStarter[];
}

const fetchPersonalizedStarters =
  async (): Promise<CompanionPersonalization | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const response = await fetch(
      `${supabaseUrl}/functions/v1/personalize?surfaces=companion`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const starters = data?.companion?.starters;
    if (!Array.isArray(starters) || starters.length === 0) return null;

    // Validate shape — if the deployed edge function still returns the
    // legacy string[] payload, every entry will fail this check and we'll
    // fall back to no personalized chips rather than rendering broken cards.
    const valid = starters.filter(
      (s): s is PersonalizedStarter =>
        s != null &&
        typeof s === 'object' &&
        typeof (s as PersonalizedStarter).id === 'string' &&
        typeof (s as PersonalizedStarter).category === 'string' &&
        typeof (s as PersonalizedStarter).prompt === 'string' &&
        typeof (s as PersonalizedStarter).iconBackground === 'string' &&
        typeof (s as PersonalizedStarter).iconName === 'string' &&
        typeof (s as PersonalizedStarter).priority === 'number'
    );
    if (valid.length === 0) {
      console.warn(
        '[usePersonalizedStarters] edge function returned legacy/invalid shape; ' +
          'deploy the latest personalize function to enable personalized chips.'
      );
      return null;
    }

    return { starters: valid };
  };

export const PERSONALIZED_STARTERS_QUERY_KEY = ['personalizedStarters', 'v2'] as const;

export const usePersonalizedStarters = () => {
  return useQuery<CompanionPersonalization | null, Error>({
    queryKey: PERSONALIZED_STARTERS_QUERY_KEY,
    queryFn: fetchPersonalizedStarters,
    staleTime: 5 * 60 * 1000,
  });
};
