import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface CompanionPersonalization {
  starters: string[];
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
    if (!data?.companion?.starters?.length) return null;

    return { starters: data.companion.starters };
  };

export const usePersonalizedStarters = () => {
  return useQuery<CompanionPersonalization | null, Error>({
    queryKey: ['personalizedStarters'],
    queryFn: fetchPersonalizedStarters,
    staleTime: 5 * 60 * 1000, // 5 minutes — starters don't change often
  });
};
