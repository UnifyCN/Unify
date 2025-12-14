import { useEffect } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/context/UserContext';
import { useOnboardingProfile } from '@/hooks/onboarding/useOnboardingProfile';
import {
  getActiveCircleMembership,
  type CommunityCircleMembership,
} from '@/services/matching/circles';
import { getCurrentWaitlistEntry } from '@/services/matching/waitlist';
import {
  formatPersonaLabel,
  formatTimeInCanadaLabel,
} from '@/matching/pools';

export default function CommunityMatchingHome() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const { data: onboardingProfile, isLoading: onboardingLoading } =
    useOnboardingProfile(currentUser?.id);

  const {
    data: waitlistEntry,
    isLoading: waitlistLoading,
    refetch: refetchWaitlist,
  } = useQuery({
    queryKey: ['community-waitlist'],
    queryFn: getCurrentWaitlistEntry,
    enabled: !!currentUser,
  });

  const { data: activeCircle, isLoading: circleLoading } = useQuery({
    queryKey: ['community-active-circle'],
    queryFn: getActiveCircleMembership,
    enabled: !!currentUser,
  });

  useEffect(() => {
    if (activeCircle) {
      router.replace(
        `/community-matching/circle/${activeCircle.circle_id}` as const
      );
    }
  }, [activeCircle, router]);

  useEffect(() => {
    if (!activeCircle && waitlistEntry?.status === 'waiting') {
      router.replace('/community-matching/waiting-room' as const);
    }
  }, [waitlistEntry, activeCircle, router]);

  useEffect(() => {
    if (!waitlistEntry && currentUser) {
      refetchWaitlist();
    }
  }, [waitlistEntry, currentUser, refetchWaitlist]);

  if (onboardingLoading || waitlistLoading || circleLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size='large' />
      </SafeAreaView>
    );
  }

  const hasPersona =
    !!onboardingProfile?.persona && !!onboardingProfile?.time_in_canada;

  if (!hasPersona) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Complete onboarding first</Text>
          <Text style={styles.body}>
            We use your persona and time-in-Canada info to match you with the
            right peers. Finish onboarding to unlock Community Matching.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.push('/community-matching/complete-onboarding' as const)
            }
          >
            <Text style={styles.primaryButtonText}>
              Complete onboarding to join matching
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.pageEyebrow}>Community Matching</Text>
        <Text style={styles.pageTitle}>Meet your Unify Circle</Text>
        <Text style={styles.body}>
          Join a group of four newcomers with the same interests in
          Canada. Circles run for 14 days.
        </Text>
        <View style={styles.poolPill}>
          <Text style={styles.poolPillText}>
            {formatPersonaLabel(onboardingProfile?.persona)} •{' '}
            {formatTimeInCanadaLabel(onboardingProfile?.time_in_canada)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/community-matching/onboarding' as const)}
        >
          <Text style={styles.primaryButtonText}>Start matching</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryText}>Back to Community tab</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 16,
  },
  pageEyebrow: {
    color: '#588DD1',
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F1300',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4A3F35',
  },
  poolPill: {
    backgroundColor: '#FFF4E4',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  poolPillText: {
    color: '#7C4A00',
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: '#FF7A18',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryText: {
    color: '#6E6E6E',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
