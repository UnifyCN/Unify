import { useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
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
  deriveTimeInCanadaFromArrivalDate,
} from '@/matching/pools';
import BackHeader from '@/components/BackHeader';

// Feature highlight component
function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={featureStyles.item}>
      <View style={featureStyles.iconCircle}>
        <Feather name={icon as any} size={20} color="#588DD1" />
      </View>
      <View style={featureStyles.textContainer}>
        <Text style={featureStyles.title}>{title}</Text>
        <Text style={featureStyles.description}>{description}</Text>
      </View>
    </View>
  );
}

const featureStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

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
      <View style={styles.centered}>
        <ActivityIndicator size='large' color="#588DD1" />
      </View>
    );
  }

  const derivedTimeInCanada = deriveTimeInCanadaFromArrivalDate(
    onboardingProfile?.arrival_date
  );
  const hasPersona = !!onboardingProfile?.persona && !!derivedTimeInCanada;

  if (!hasPersona) {
    return (
      <View style={styles.root}>
        <BackHeader title="" onBack={() => router.back()} />
        <View style={styles.incompleteContainer}>
          <View style={styles.incompleteIconCircle}>
            <Feather name="user-check" size={32} color="#588DD1" />
          </View>
          <Text style={styles.incompleteTitle}>Complete your profile</Text>
          <Text style={styles.incompleteBody}>
            We use your background and experience to match you with the right peers. Complete onboarding to unlock Unify Circles.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.push('/community-matching/complete-onboarding' as const)
            }
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Complete onboarding</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <BackHeader title="" onBack={() => router.back()} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <View style={styles.heroIconRing} />
            <View style={styles.heroIconCircle}>
              <Feather name="users" size={28} color="#fff" />
            </View>
          </View>
          <Text style={styles.heroTitle}>Unify Circles</Text>
          <Text style={styles.heroSubtitle}>
            Connect with 3 newcomers who share your journey. Chat, support each other, and grow together for 14 days.
          </Text>
        </View>

        {/* Your matching profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardHeader}>
            <Feather name="target" size={18} color="#588DD1" />
            <Text style={styles.profileCardLabel}>Your matching profile</Text>
          </View>
          <View style={styles.profileCardContent}>
            <View style={styles.profileRow}>
              <Feather name="user" size={16} color="#6B7280" />
              <Text style={styles.profileText}>
                {formatPersonaLabel(onboardingProfile?.persona)}
              </Text>
            </View>
            <View style={styles.profileRow}>
              <Feather name="calendar" size={16} color="#6B7280" />
              <Text style={styles.profileText}>
                {formatTimeInCanadaLabel(derivedTimeInCanada)}
              </Text>
            </View>
          </View>
        </View>

        {/* How it works section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <FeatureItem 
            icon="users"
            title="Get matched"
            description="We'll pair you with 3 newcomers on a similar journey"
          />
          <FeatureItem 
            icon="message-circle"
            title="Chat together"
            description="Share experiences, ask questions, and support each other"
          />
          <FeatureItem 
            icon="calendar"
            title="14-day journey"
            description="Build meaningful connections over two weeks"
          />
        </View>
      </ScrollView>

      {/* Fixed footer with CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/community-matching/onboarding' as const)}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Start matching</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.back()}
          activeOpacity={0.6}
        >
          <Text style={styles.secondaryText}>Back to Community</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 180,
  },
  // Hero section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroIconRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0ECFA',
  },
  heroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#588DD1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#588DD1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  // Profile card
  profileCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  profileCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#588DD1',
  },
  profileCardContent: {
    gap: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  // Features section
  featuresSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 34,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#588DD1',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#588DD1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  // Incomplete onboarding state
  incompleteContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  incompleteIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  incompleteTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  incompleteBody: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});
