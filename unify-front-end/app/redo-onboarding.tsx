import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import OnboardingQuiz from '@/components/onboarding/OnboardingQuiz';
import BackHeader from '@/components/BackHeader';
import { useCurrentUser } from '@/context/UserContext';

export default function RedoOnboardingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();

  const handleComplete = () => {
    // Invalidate the onboarding profile cache so the app picks up new data
    if (currentUser?.id) {
      queryClient.invalidateQueries({
        queryKey: ['onboardingProfile', currentUser.id],
      });
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <BackHeader title='' onBack={() => router.back()} />
      <OnboardingQuiz
        onComplete={handleComplete}
        isRedo
        prefilledName={currentUser?.firstName ?? null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
