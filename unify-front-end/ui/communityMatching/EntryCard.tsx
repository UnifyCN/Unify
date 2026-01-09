import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter, Href } from 'expo-router';
import { useCurrentUser } from '@/context/UserContext';
import { getCurrentWaitlistEntry } from '@/services/matching/waitlist';
import { getActiveCircleMembership } from '@/services/matching/circles';

interface EntryCardProps {
  onPress: () => void;
}

export function CommunityMatchingEntryCard({ onPress }: EntryCardProps) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const { data: waitlistEntry, isLoading: waitlistLoading } = useQuery({
    queryKey: ['community-waitlist'],
    queryFn: getCurrentWaitlistEntry,
    enabled: !!currentUser,
  });

  const { data: activeCircle, isLoading: circleLoading } = useQuery({
    queryKey: ['community-active-circle'],
    queryFn: getActiveCircleMembership,
    enabled: !!currentUser,
  });

  const isLoading = waitlistLoading || circleLoading;
  const isInCircle = !!activeCircle;
  const isWaiting = waitlistEntry?.status === 'waiting';

  const handlePress = () => {
    if (isInCircle) {
      router.push(`/community-matching/circle/${activeCircle.circle_id}` as Href);
    } else if (isWaiting) {
      router.push('/community-matching/waiting-room' as Href);
    } else {
      onPress();
    }
  };

  const getStatusContent = () => {
    if (isLoading) {
      return {
        icon: null,
        badge: null,
        cta: 'Loading...',
      };
    }
    if (isInCircle) {
      return {
        icon: 'message-circle' as const,
        badge: { text: 'In Circle', color: '#0F8B54', bg: '#E6F8EE' },
        cta: 'Open my circle',
      };
    }
    if (isWaiting) {
      return {
        icon: 'clock' as const,
        badge: { text: 'Finding matches', color: '#588DD1', bg: '#EBF4FF' },
        cta: 'Check status',
      };
    }
    return {
      icon: 'users' as const,
      badge: null,
      cta: 'Find my circle',
    };
  };

  const status = getStatusContent();

  return (
    <TouchableOpacity 
      style={[styles.card, isInCircle && styles.cardActive]} 
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={styles.iconContainer}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#588DD1" />
        ) : (
          <Feather name={status.icon!} size={24} color="#588DD1" />
        )}
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Unify Circles</Text>
          {status.badge && (
            <View style={[styles.badge, { backgroundColor: status.badge.bg }]}>
              <Text style={[styles.badgeText, { color: status.badge.color }]}>
                {status.badge.text}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>
          {isInCircle
            ? 'Your circle is active! Chat with your newcomer peers.'
            : isWaiting
              ? "Looking for people like you. We'll notify you when matched!"
              : 'Be matched into 14-day Circles with people on the same newcomer path.'}
        </Text>
      </View>
      <View style={styles.ctaButton}>
        <Text style={styles.ctaText}>{status.cta}</Text>
        <Feather name="chevron-right" size={18} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    gap: 16,
  },
  cardActive: {
    borderWidth: 2,
    borderColor: '#588DD1',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2A1B00',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6E6E6E',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#588DD1',
    paddingVertical: 12,
    borderRadius: 999,
    gap: 6,
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

