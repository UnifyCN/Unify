import { useState, useEffect, useMemo } from 'react';
import { Alert, View, StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { MatchingOnboardingQuiz } from '@/ui/communityMatching/MatchingOnboardingQuiz';
import { joinCommunityWaitlist } from '@/services/matching/waitlist';
import { useOnboardingProfile } from '@/hooks/onboarding/useOnboardingProfile';
import { useCurrentUser } from '@/context/UserContext';
import { deriveTimeInCanadaFromArrivalDate } from '@/matching/pools';
import BackHeader from '@/components/BackHeader';


export default function MatchingOnboardingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const { data: onboardingProfile } = useOnboardingProfile(currentUser?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive time_in_canada from arrival_date
  const derivedTimeInCanada = useMemo(
    () => deriveTimeInCanadaFromArrivalDate(onboardingProfile?.arrival_date),
    [onboardingProfile?.arrival_date]
  );

  useEffect(() => {
    if (
      onboardingProfile &&
      (!onboardingProfile.persona || !derivedTimeInCanada)
    ) {
      router.replace('/community-matching' as const);
    }
  }, [onboardingProfile, derivedTimeInCanada, router]);

  const handleComplete = async () => {
    if (!onboardingProfile?.persona || !derivedTimeInCanada) {
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
        timeInCanada: derivedTimeInCanada,
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
    <View style={styles.root}>
      <BackHeader title="" onBack={() => router.back()} />
      <MatchingOnboardingQuiz


        onComplete={handleComplete}
        isSubmitting={isSubmitting}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
