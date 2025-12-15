import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveOnboardingProfile } from '@/services/onboarding/saveOnboardingProfile';
import {
  OnboardingProfileInput,
  UserOnboardingProfile,
} from '@/types/onboardingProfile';
import { supabase } from '@/lib/supabase';

export const useSaveOnboardingProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UserOnboardingProfile,
    Error,
    { userId: string; data: OnboardingProfileInput }
  >({
    mutationFn: ({ userId, data }) => saveOnboardingProfile(userId, data),
    onSuccess: (data, variables) => {
      // Update the cache with the authoritative mutation response
      // handleOnboardingComplete will refetch to ensure consistency
      queryClient.setQueryData(
        ['onboardingProfile', variables.userId],
        data
      );
      // Removed invalidateQueries - handleOnboardingComplete handles refetch
    },
  });
};
