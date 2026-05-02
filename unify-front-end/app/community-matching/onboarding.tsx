import { useState, useEffect, useMemo } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  MatchingOnboardingQuiz,
  QuizSelections,
} from '@/ui/communityMatching/MatchingOnboardingQuiz';
import { joinCommunityWaitlist } from '@/services/matching/waitlist';
import { useOnboardingProfile } from '@/hooks/onboarding/useOnboardingProfile';
import { useCurrentUser } from '@/context/UserContext';
import { deriveTimeInCanadaFromArrivalDate } from '@/matching/pools';

export default function MatchingOnboardingScreen() {
  const { t } = useTranslation();
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

  const handleComplete = async (selections: QuizSelections) => {
    if (!onboardingProfile?.persona || !derivedTimeInCanada) {
      Alert.alert(
        t('circles.missingInfoTitle'),
        t('circles.missingInfoMessage')
      );
      router.replace('/community-matching' as const);
      return;
    }
    setIsSubmitting(true);
    try {
      await joinCommunityWaitlist({
        persona: onboardingProfile.persona,
        timeInCanada: derivedTimeInCanada,
        goal: selections.goal ?? null,
        topics: selections.topics ?? [],
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['community-waitlist'] }),
        queryClient.invalidateQueries({
          queryKey: ['community-active-circle'],
        }),
      ]);
      router.replace('/community-matching/waiting-room' as const);
    } catch (error) {
      console.error('Failed to enter waitlist', error);
      Alert.alert(
        t('circles.somethingWentWrong'),
        t('circles.tryAgainMessage')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <MatchingOnboardingQuiz
        onComplete={handleComplete}
        onClose={() => router.back()}
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
