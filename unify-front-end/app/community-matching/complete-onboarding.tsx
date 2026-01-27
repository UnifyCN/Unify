import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import OnboardingQuiz from '@/components/onboarding/OnboardingQuiz';
import BackHeader from '@/components/BackHeader';


export default function CompleteOnboardingScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <BackHeader title="Complete Profile" onBack={() => router.back()} />
      <View style={styles.container}>


        <OnboardingQuiz
          onComplete={() => router.replace('/community-matching' as const)}
        />
      </View>
    </View>

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
