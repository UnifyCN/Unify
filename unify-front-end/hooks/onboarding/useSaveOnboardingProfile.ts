import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveOnboardingProfile } from '@/services/onboarding/saveOnboardingProfile';
import {
  OnboardingProfileInput,
  UserOnboardingProfile,
} from '@/types/onboardingProfile';
import { PERSONALIZED_STARTERS_QUERY_KEY } from '@/hooks/companion/usePersonalizedStarters';

export const useSaveOnboardingProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UserOnboardingProfile,
    Error,
    { userId: string; data: OnboardingProfileInput }
  >({
    mutationFn: ({ userId, data }) => saveOnboardingProfile(userId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['onboardingProfile', variables.userId], data);
      queryClient.invalidateQueries({ queryKey: PERSONALIZED_STARTERS_QUERY_KEY });
    },
  });
};
