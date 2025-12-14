import { useState, useEffect } from 'react';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { MatchingOnboardingQuiz } from '@/ui/communityMatching/MatchingOnboardingQuiz';
import { joinCommunityWaitlist } from '@/services/matching/waitlist';
import { useOnboardingProfile } from '@/hooks/onboarding/useOnboardingProfile';
import { useCurrentUser } from '@/context/UserContext';

export default function MatchingOnboardingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const { data: onboardingProfile } = useOnboardingProfile(currentUser?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (
      onboardingProfile &&
      (!onboardingProfile.persona || !onboardingProfile.time_in_canada)
    ) {
      router.replace('/community-matching' as const);
    }
  }, [onboardingProfile, router]);

  const handleComplete = async () => {
    if (!onboardingProfile?.persona || !onboardingProfile?.time_in_canada) {
      Alert.alert(
        'Missing info',
        'Finish onboarding first so we know your matching persona.'
      );
      router.replace('/community-matching' as const);
      return;
    }
    setIsSubmitting(true);
    try {
      await joinCommunityWaitlist({
        persona: onboardingProfile.persona,
        timeInCanada: onboardingProfile.time_in_canada,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['community-waitlist'] }),
        queryClient.invalidateQueries({ queryKey: ['community-active-circle'] }),
      ]);
      router.replace('/community-matching/waiting-room' as const);
    } catch (error) {
      console.error('Failed to enter waitlist', error);
      Alert.alert(
        'Something went wrong',
        'Please try again in a moment or check your connection.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <MatchingOnboardingQuiz
        onComplete={handleComplete}
        isSubmitting={isSubmitting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
