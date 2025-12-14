import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/context/UserContext';
import {
  getCircleById,
  getCircleMembers,
  getMembershipForCircle,
  leaveCircle,
  markCircleJoined,
} from '@/services/matching/circles';
import { formatPersonaLabel, formatTimeInCanadaLabel } from '@/matching/pools';
import type {
  CommunityCircle,
  CommunityCircleMemberProfile,
} from '@/types/matching';
import { FollowButton } from '@/components/profile/FollowButton';

export default function CircleDetailsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const { currentUser } = useCurrentUser();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    data: circle,
    isLoading: circleLoading,
    error: circleError,
  } = useQuery({
    queryKey: ['community-circle', circleId],
    queryFn: () => getCircleById(circleId as string),
    enabled: !!circleId,
  });

  const {
    data: members,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ['community-circle-members', circleId],
    queryFn: () => getCircleMembers(circleId as string),
    enabled: !!circleId,
  });

  const {
    data: membership,
    refetch: refetchMembership,
    isLoading: membershipLoading,
  } = useQuery({
    queryKey: ['community-circle-membership', circleId],
    queryFn: () => getMembershipForCircle(circleId as string),
    enabled: !!circleId,
  });

  const isActive = circle?.status === 'active';
  const hasJoinedChat = !!membership?.joined_at && !membership.left_at;
  const hasLeftCircle = !!membership?.left_at;

  const handleJoin = useCallback(async () => {
    if (!circleId) return;
    setIsProcessing(true);
    try {
      await markCircleJoined(circleId as string);
      await Promise.all([
        refetchMembers(),
        refetchMembership(),
        queryClient.invalidateQueries({
          queryKey: ['community-active-circle'],
        }),
      ]);
      router.push(
        `/community-matching/circle/${circleId}/chat` as const
      );
    } catch (error) {
      console.error('Failed to join circle chat', error);
      Alert.alert(
        'Unable to join',
        'Please try again in a moment. If the issue persists, re-open the app.'
      );
    } finally {
      setIsProcessing(false);
    }
  }, [circleId, queryClient, refetchMembers, refetchMembership, router]);

  const handleLeave = useCallback(() => {
    if (!circleId) return;
    Alert.alert(
      'Leave this circle?',
      'You can always rejoin matching to meet a new circle later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave circle',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveCircle(circleId as string);
              await Promise.all([
                queryClient.invalidateQueries({
                  queryKey: ['community-active-circle'],
                }),
                queryClient.invalidateQueries({
                  queryKey: ['community-circle-membership', circleId],
                }),
              ]);
              router.replace('/community-matching' as const);
            } catch (error) {
              console.error('Failed to leave circle', error);
              Alert.alert(
                'Unable to leave',
                'Please try again in a moment.'
              );
            }
          },
        },
      ]
    );
  }, [circleId, queryClient, router]);

  const handleOpenChat = useCallback(() => {
    router.push(`/community-matching/circle/${circleId}/chat` as const);
  }, [router, circleId]);

  const formattedDates = useMemo(() => {
    if (!circle) return null;
    const start = new Date(circle.created_at);
    const end = new Date(circle.ends_at);
    const format = (date: Date) =>
      date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${format(start)} — ${format(end)}`;
  }, [circle]);

  if (circleLoading || membersLoading || membershipLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size='large' />
      </SafeAreaView>
    );
  }

  if (circleError || !circle) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>
          We couldn’t find this circle. It may have ended or been removed.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/community-matching' as const)}
        >
          <Text style={styles.primaryButtonText}>Back to matching</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const showJoinButton = isActive && !hasJoinedChat && !hasLeftCircle;
  const showChatButton = hasJoinedChat && !hasLeftCircle;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>
          {formatPersonaLabel(circle.persona)}
        </Text>
        <Text style={styles.subheading}>
          {formatTimeInCanadaLabel(circle.time_in_canada)}
        </Text>
        <Text style={styles.meta}>{formattedDates}</Text>
        <View
          style={[
            styles.statusPill,
            isActive ? styles.statusActive : styles.statusEnded,
          ]}
        >
          <Text
            style={isActive ? styles.statusActiveText : styles.statusEndedText}
          >
            {circle.status === 'active' ? 'Active (14 days)' : 'Circle ended'}
          </Text>
        </View>

        {hasLeftCircle && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>You left this circle</Text>
            <Text style={styles.infoBody}>
              Rejoin matching whenever you’re ready for a new circle.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, styles.infoButton]}
              onPress={() => router.replace('/community-matching' as const)}
            >
              <Text style={styles.primaryButtonText}>Start matching again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isActive && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Circle closed</Text>
            <Text style={styles.infoBody}>
              Follow your favorite members and rejoin matching to meet new
              people.
            </Text>
          </View>
        )}

        <View style={styles.membersHeader}>
          <Text style={styles.membersTitle}>Members</Text>
          <Text style={styles.membersCount}>
            {members?.filter(m => !m.left_at).length || 0}/4 active
          </Text>
        </View>

        {members?.map(member => {
          const isSelf = member.user_id === currentUser?.id;
          const statusText = member.left_at
            ? 'Left the circle'
            : member.joined_at
              ? 'In chat'
              : 'Hasn’t joined chat yet';
          return (
            <View key={member.id} style={styles.memberRow}>
              {member.user.profile_picture_url ? (
                <Image
                  source={{ uri: member.user.profile_picture_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarFallbackText}>
                    {member.user.username?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.user.username}
                  {isSelf && ' (You)'}
                </Text>
                <Text style={styles.memberStatus}>{statusText}</Text>
              </View>
              {!isSelf && circle.status === 'ended' && (
                <FollowButton targetUserId={member.user_id} />
              )}
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        {showJoinButton && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleJoin}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <Text style={styles.primaryButtonText}>Join circle chat</Text>
            )}
          </TouchableOpacity>
        )}
        {showChatButton && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleOpenChat}
          >
            <Text style={styles.primaryButtonText}>Open circle chat</Text>
          </TouchableOpacity>
        )}
        {!hasLeftCircle && (
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
            <Text style={styles.leaveText}>
              {isActive ? 'Leave circle' : 'Start matching again'}
            </Text>
          </TouchableOpacity>
        )}
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  backBtn: {
    marginBottom: 12,
  },
  backText: {
    color: '#6E6E6E',
    fontSize: 15,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F1300',
  },
  subheading: {
    fontSize: 18,
    color: '#4A3F35',
    marginTop: 4,
  },
  meta: {
    fontSize: 14,
    color: '#6E6E6E',
    marginTop: 8,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 12,
  },
  statusActive: {
    backgroundColor: '#E6F8EE',
  },
  statusActiveText: {
    color: '#0F8B54',
    fontWeight: '600',
  },
  statusEnded: {
    backgroundColor: '#FDECE6',
  },
  statusEndedText: {
    color: '#B5330F',
    fontWeight: '600',
  },
  infoCard: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: '#F8F7FF',
    padding: 16,
    gap: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A1B3D',
  },
  infoBody: {
    color: '#4C4376',
    lineHeight: 20,
  },
  infoButton: {
    marginTop: 8,
  },
  membersHeader: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  membersCount: {
    color: '#6E6E6E',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEE',
  },
  avatarFallback: {
    backgroundColor: '#FFE0CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#CC5500',
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberStatus: {
    fontSize: 13,
    color: '#6E6E6E',
  },
  footer: {
    padding: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    backgroundColor: '#fff',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF7A18',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  leaveButton: {
    borderWidth: 1,
    borderColor: '#E74C3C',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  leaveText: {
    color: '#E74C3C',
    fontWeight: '600',
  },
});
