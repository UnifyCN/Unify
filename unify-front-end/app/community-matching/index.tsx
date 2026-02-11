import { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useCurrentUser } from '@/context/UserContext';
import { useOnboardingProfile } from '@/hooks/onboarding/useOnboardingProfile';
import { getActiveCircleMembership } from '@/services/matching/circles';
import { getCurrentWaitlistEntry } from '@/services/matching/waitlist';
import {
  deriveTimeInCanadaFromArrivalDate,
} from '@/matching/pools';
import BackHeader from '@/components/BackHeader';
import LoadingScreen from '@/components/LoadingScreen';

// Design colors from Figma
const COLORS = {
  heroIconBackground: '#ffaf63',
  featureIconBackground: '#ff9d40',
  buttonBackground: '#ff9b3d',
  titleColor: '#000000',
  descriptionColor: '#474747',
  backLinkColor: '#585858',
  white: '#ffffff',
};

// Feature highlight component
function FeatureItem({ 
  icon, 
  title, 
  description,
  iconType = 'material'
}: { 
  icon: string; 
  title: string; 
  description: string;
  iconType?: 'material' | 'feather';
}) {
  return (
    <View style={featureStyles.item}>
      <View style={featureStyles.iconCircle}>
        {iconType === 'material' ? (
          <MaterialIcons name={icon as any} size={20} color={COLORS.white} />
        ) : (
          <Feather name={icon as any} size={20} color={COLORS.white} />
        )}
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
    paddingVertical: 18,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 100,
    backgroundColor: COLORS.featureIconBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.titleColor,
  },
  description: {
    fontSize: 16,
    color: COLORS.titleColor,
    lineHeight: 22,
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

  // Consolidated navigation effect with priority order:
  // 1. Active circle takes precedence - redirect to circle detail
  // 2. Waiting status - redirect to waiting room
  // 3. No waitlist entry - refetch to check status
  useEffect(() => {
    if (activeCircle) {
      router.replace(`/community-matching/circle/${activeCircle.circle_id}` as const);
    } else if (waitlistEntry?.status === 'waiting') {
      router.replace('/community-matching/waiting-room' as const);
    } else if (!waitlistEntry && currentUser) {
      refetchWaitlist();
    }
  }, [activeCircle, waitlistEntry, currentUser, router, refetchWaitlist]);

  if (onboardingLoading || waitlistLoading || circleLoading) {
    return <LoadingScreen />;
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
            <MaterialIcons name="person-add" size={32} color={COLORS.white} />
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
            <Feather name="arrow-right" size={18} color={COLORS.white} />
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
        <View style={styles.heroIconCircle}>
            <MaterialIcons name="group-add" size={34} color={COLORS.white} />
          </View>
          <Text style={styles.heroTitle}>Unify Circles</Text>
          <Text style={styles.heroSubtitle}>
            Get matched with 3 newcomers for a 2-week group chat experience!
          </Text>
        </View>

        {/* Features section */}
        <View style={styles.featuresSection}>
          <FeatureItem 
            icon="group-add"
            iconType="material"
            title="Matching"
            description="Get paired based on your own journey and background"
          />
          <FeatureItem 
            icon="schedule"
            iconType="material"
            title="2-Week Duration"
            description="Fixed duration with icebreakers and prompts to guide your conversations"
          />
          <FeatureItem 
            icon="chat-bubble"
            iconType="material"
            title="Group Chat"
            description="Connect and share experiences, and leave with new friends"
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
          <Text style={styles.primaryButtonText}>Start Matching</Text>
          <Feather name="arrow-right" size={18} color={COLORS.white} />
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 180,
  },
  // Hero section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 100,
    backgroundColor: COLORS.heroIconBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.titleColor,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.descriptionColor,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 24,
  },
  // Features section
  featuresSection: {
    marginTop: 8,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 26,
    backgroundColor: '#fff',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.buttonBackground,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryText: {
    color: COLORS.backLinkColor,
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: COLORS.heroIconBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  incompleteTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.titleColor,
    textAlign: 'center',
  },
  incompleteBody: {
    fontSize: 16,
    color: COLORS.descriptionColor,
    textAlign: 'center',
    lineHeight: 24,
  },
});
