import { supabase } from '@/lib/supabase';
import { Persona } from '@/types/onboardingProfile';

export interface PublicOnboardingProfile {
  persona: Persona | null;
  persona_other: string | null;
  arrival_date: string | null;
}

export const getPublicOnboardingProfile = async (
  userId: string
): Promise<PublicOnboardingProfile | null> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'public-onboarding-profile',
      {
        body: { userId },
      }
    );

    if (error) {
      throw error;
    }

    return data?.profile ?? null;
  } catch (error) {
    console.error('Error fetching public onboarding profile:', error);
    return null;
  }
};
