import { supabase } from '@/lib/supabase';
import {
  OnboardingProfileInput,
  UserOnboardingProfile,
} from '@/types/onboardingProfile';
import { calculateUserStage, stageNumberToEnum } from '@/helpers/dateHelpers';

export const saveOnboardingProfile = async (
  userId: string,
  data: OnboardingProfileInput
): Promise<UserOnboardingProfile> => {
  try {
    // Calculate stage if arrival_date is provided and onboarding is being completed
    let calculatedStage: string | null = null;
    if (data.arrival_date && data.onboarding_completed) {
      const arrivalDate = new Date(data.arrival_date);
      const stageNumber = calculateUserStage(arrivalDate);
      calculatedStage = stageNumberToEnum(stageNumber);
    }

    // Prepare the data for Supabase (convert to snake_case)
    const supabaseData: any = {
      id: userId,
      persona: data.persona ?? null,
      persona_other: data.persona_other ?? null,
      referral_source: data.referral_source ?? null,
      referral_source_other: data.referral_source_other ?? null,
      arrival_date: data.arrival_date ?? null,
      goals: data.goals || [],
      goals_other: data.goals_other ?? null,
      learning_interests: data.learning_interests || [],
      learning_interests_other: data.learning_interests_other ?? null,
      hobbies: data.hobbies || [],
      wants_reminders: data.wants_reminders ?? false,
      onboarding_completed: data.onboarding_completed ?? false,
    };

    // Add stage to the data if it was calculated
    if (calculatedStage !== null) {
      supabaseData.stage = calculatedStage;
    }

    // Upsert the profile
    const { data: result, error } = await supabase
      .from('user_onboarding_profiles')
      .upsert(supabaseData, {
        onConflict: 'id',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save onboarding profile: ${error.message}`);
    }

    return {
      id: result.id,
      persona: result.persona,
      persona_other: result.persona_other,
      referral_source: result.referral_source,
      referral_source_other: result.referral_source_other,
      arrival_date: result.arrival_date,
      stage: result.stage,
      goals: result.goals || [],
      goals_other: result.goals_other,
      learning_interests: result.learning_interests || [],
      learning_interests_other: result.learning_interests_other,
      hobbies: result.hobbies || [],
      wants_reminders: result.wants_reminders ?? false,
      onboarding_completed: result.onboarding_completed ?? false,
      onboarding_completed_at: result.onboarding_completed_at,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  } catch (error) {
    console.error('Error saving onboarding profile:', error);
    throw error;
  }
};
