import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveOnboardingProfile } from '@/services/onboarding/saveOnboardingProfile';
import {
  OnboardingProfileInput,
  UserOnboardingProfile,
} from '@/types/onboardingProfile';

export const useSaveOnboardingProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UserOnboardingProfile,
    Error,
    { userId: string; data: OnboardingProfileInput }
  >({
    mutationFn: ({ userId, data }) => saveOnboardingProfile(userId, data),
    onSuccess: (data, variables) => {
      // Update cache with authoritative mutation response
      // React Query will automatically notify subscribers (AuthWrapper) to re-render
      queryClient.setQueryData(['onboardingProfile', variables.userId], data);
    },
  });
};
