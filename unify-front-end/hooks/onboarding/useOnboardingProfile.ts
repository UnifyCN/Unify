import { useQuery } from '@tanstack/react-query';
import { getOnboardingProfile } from '@/services/onboarding/getOnboardingProfile';
import { UserOnboardingProfile } from '@/types/onboardingProfile';

export const useOnboardingProfile = (userId?: string) => {
  return useQuery<UserOnboardingProfile | null, Error>({
    queryKey: ['onboardingProfile', userId],
    queryFn: () => getOnboardingProfile(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

