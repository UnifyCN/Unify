import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import OnboardingQuiz from '@/components/onboarding/OnboardingQuiz';

export default function CompleteOnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <OnboardingQuiz
          onComplete={() => router.replace('/community-matching' as const)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
});
