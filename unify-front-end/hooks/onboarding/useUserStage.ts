import { useEffect, useState } from 'react';
import { getOnboardingProfile } from '@/services/onboarding/getOnboardingProfile';
import { updateUserStage } from '@/services/onboarding/updateUserStage';
import {
  calculateUserStage,
  stageNumberToEnum,
  stageEnumToNumber,
} from '@/helpers/dateHelpers';
import { supabase } from '@/lib/supabase';

export const useUserStage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<number | null>(null);
  const [previousStage, setPreviousStage] = useState<number | null>(null);
  const [stageChanged, setStageChanged] = useState(false);

  useEffect(() => {
    const checkAndUpdateStage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        // Fetch onboarding profile
        const profile = await getOnboardingProfile(user.id);

        console.log('📋 useUserStage - Profile:', {
          hasProfile: !!profile,
          arrivalDate: profile?.arrival_date,
          storedStage: profile?.stage,
        });

        if (!profile || !profile.arrival_date) {
          // No profile or arrival date, cannot calculate stage
          console.log('📋 useUserStage - No profile or arrival date');
          setCurrentStage(null);
          return;
        }

        // Calculate stage based on arrival date
        const arrivalDate = new Date(profile.arrival_date);
        const calculatedStageNumber = calculateUserStage(arrivalDate);
        const calculatedStageEnum = stageNumberToEnum(calculatedStageNumber);
        const storedStageNumber = profile.stage
          ? stageEnumToNumber(profile.stage)
          : null;

        console.log('📋 useUserStage - Stage calculated:', {
          arrivalDate: arrivalDate.toISOString(),
          calculatedStageNumber,
          calculatedStageEnum,
          storedStage: profile.stage,
          storedStageNumber,
          hasChanged: profile.stage !== calculatedStageEnum,
        });

        setCurrentStage(calculatedStageNumber);
        setPreviousStage(storedStageNumber);

        // Check if stage has changed
        const hasChanged = profile.stage !== calculatedStageEnum;
        setStageChanged(hasChanged);

        // Update stage if it differs from the stored value
        if (hasChanged) {
          console.log('📋 useUserStage - Updating stage in DB');
          await updateUserStage(user.id, calculatedStageNumber);
        }
      } catch (err) {
        console.error('Error checking user stage:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    checkAndUpdateStage();
  }, []);

  return { currentStage, previousStage, stageChanged, isLoading, error };
};
