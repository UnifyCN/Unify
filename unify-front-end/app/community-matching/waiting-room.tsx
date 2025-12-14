import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/context/UserContext';
import { getCurrentWaitlistEntry, leaveCommunityWaitlist } from '@/services/matching/waitlist';
import { getActiveCircleMembership } from '@/services/matching/circles';
import {
  formatPersonaLabel,
  formatTimeInCanadaLabel,
} from '@/matching/pools';
import { supabase } from '@/lib/supabase';

export default function WaitingRoomScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const [joiningCircleId, setJoiningCircleId] = useState<string | null>(null);

  const {
    data: waitlistEntry,
    isLoading,
    refetch: refetchWaitlist,
  } = useQuery({
    queryKey: ['community-waitlist'],
    queryFn: getCurrentWaitlistEntry,
    enabled: !!currentUser,
  });

  const { data: activeCircle } = useQuery({
    queryKey: ['community-active-circle'],
    queryFn: getActiveCircleMembership,
    enabled: !!currentUser,
  });

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const waitlistChannel = supabase
      .channel(`community-waitlist-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_match_waitlist',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => refetchWaitlist()
      )
      .subscribe();

    const membersChannel = supabase
      .channel(`community-circle-members-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_circle_members',
          filter: `user_id=eq.${currentUser.id}`,
        },
        payload => {
          setJoiningCircleId(payload.new.circle_id);
          router.replace(
            `/community-matching/circle/${payload.new.circle_id}` as const
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(waitlistChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [currentUser, refetchWaitlist, router]);

  useEffect(() => {
    if (activeCircle) {
      router.replace(`/community-matching/circle/${activeCircle.circle_id}` as const);
    }
  }, [activeCircle, router]);

  useEffect(() => {
    if (!isLoading && !waitlistEntry && !joiningCircleId) {
      router.replace('/community-matching' as const);
    }
  }, [waitlistEntry, isLoading, router, joiningCircleId]);

  const handleLeave = async () => {
    Alert.alert(
      'Leave waitlist',
      'Are you sure you want to leave? You can rejoin anytime.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveCommunityWaitlist();
              await queryClient.invalidateQueries({
                queryKey: ['community-waitlist'],
              });
              router.replace('/community-matching' as const);
            } catch (error) {
              console.error('Failed to leave waitlist', error);
              Alert.alert(
                'Something went wrong',
                'Please try again in a moment.'
              );
            }
          },
        },
      ]
    );
  };

  if (isLoading || !waitlistEntry) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size='large' />
        <Text style={styles.helperText}>Preparing your waiting room…</Text>
      </SafeAreaView>
    );
  }

  const joinedDate = new Date(waitlistEntry.created_at);
  const joinedDisplay = `${joinedDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} at ${joinedDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.title}>You're in the waiting room</Text>
        <Text style={styles.subtitle}>
          We’ll notify you once we find three more people just like you.
        </Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {formatPersonaLabel(waitlistEntry.persona)} •{' '}
            {formatTimeInCanadaLabel(waitlistEntry.time_in_canada)}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardHeading}>What happens next?</Text>
          <Text style={styles.cardBody}>
            • Matching runs every few minutes. {'\n'}• Circles form instantly
            when 4 compatible people are ready. {'\n'}• You’ll get an in-app
            + push notification once a circle is created.
          </Text>
        </View>
        <View style={styles.status}>
          <Text style={styles.statusLabel}>Joined</Text>
          <Text style={styles.statusValue}>{joinedDisplay}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
        <Text style={styles.leaveButtonText}>Leave waitlist</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'space-between',
  },
  centered: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  helperText: {
    color: '#6E6E6E',
    fontSize: 14,
  },
  content: {
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F1300',
  },
  subtitle: {
    fontSize: 16,
    color: '#4A3F35',
    lineHeight: 22,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF4E4',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  pillText: {
    color: '#7C4A00',
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#F9F5FF',
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4C1D95',
    marginBottom: 6,
  },
  cardBody: {
    color: '#4C1D95',
    lineHeight: 20,
  },
  status: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  statusLabel: {
    fontSize: 13,
    color: '#6E6E6E',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    color: '#1F1300',
    fontWeight: '600',
  },
  leaveButton: {
    borderWidth: 1,
    borderColor: '#E74C3C',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
  },
});
