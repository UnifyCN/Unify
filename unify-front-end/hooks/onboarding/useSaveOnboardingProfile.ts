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
      // Invalidate and refetch onboarding profile
      queryClient.invalidateQueries({
        queryKey: ['onboardingProfile', variables.userId],
      });
      // Also invalidate for current user (no userId provided)
      queryClient.invalidateQueries({
        queryKey: ['onboardingProfile'],
      });
    },
  });
};

