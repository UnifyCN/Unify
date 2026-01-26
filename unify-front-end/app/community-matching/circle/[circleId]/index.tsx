import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

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
import BackHeader from '@/components/BackHeader';


export default function CircleDetailsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const { currentUser } = useCurrentUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const hasShownConfetti = useRef(false);

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

  // Show confetti only once when circle ends (prevent restart on re-render)
  useEffect(() => {
    if (!isActive && circle && !hasShownConfetti.current) {
      hasShownConfetti.current = true;
      setShowConfetti(true);
    }
  }, [isActive, circle]);

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

  const handleMemberPress = useCallback((userId: string) => {
    router.push(`/profile?userId=${userId}` as const);
  }, [router]);

  const formattedDates = useMemo(() => {
    if (!circle) return null;
    const start = new Date(circle.created_at);
    const end = new Date(circle.ends_at);
    const format = (date: Date) =>
      date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${format(start)} — ${format(end)}`;
  }, [circle]);

  const countdownText = useMemo(() => {
    if (!circle || circle.status === 'ended') return null;
    const now = new Date();
    const end = new Date(circle.ends_at);
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return 'Ending soon';
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `${days} day${days === 1 ? '' : 's'} left`;
    if (hours === 0) return 'Less than an hour left';
    return `${hours} hour${hours === 1 ? '' : 's'} left`;
  }, [circle]);

  if (circleLoading || membersLoading || membershipLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' />
      </View>
    );

  }

  if (circleError || !circle) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          We couldn't find this circle. It may have ended or been removed.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/community-matching' as const)}
        >
          <Text style={styles.primaryButtonText}>Back to matching</Text>
        </TouchableOpacity>
      </View>
    );

  }

  const showJoinButton = isActive && !hasJoinedChat && !hasLeftCircle;
  const showChatButton = hasJoinedChat && !hasLeftCircle;

  return (
    <View style={styles.root}>
      {showConfetti && (
        <ConfettiCannon 
          count={200} 
          origin={{x: Dimensions.get('window').width / 2, y: 0}} 
          fadeOut={true}
        />
      )}
      <BackHeader title="" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scrollContent}>


        <Text style={styles.heading}>
          {formatPersonaLabel(circle.persona)}
        </Text>
        <Text style={styles.subheading}>
          {formatTimeInCanadaLabel(circle.time_in_canada)}
        </Text>
        <Text style={styles.meta}>{formattedDates}</Text>
        {countdownText && (
          <View style={styles.countdownContainer}>
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>⏱️ {countdownText}</Text>
            </View>
          </View>
        )}
        <View
          style={[
            styles.statusPill,
            isActive ? styles.statusActive : styles.statusEnded,
          ]}
        >
          <Text
            style={isActive ? styles.statusActiveText : styles.statusEndedText}
          >
            {circle.status === 'active' ? 'Active Circle' : 'Circle ended'}
          </Text>
        </View>

        {hasLeftCircle && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>You left this circle</Text>
            <Text style={styles.infoBody}>
              Rejoin matching whenever you're ready for a new circle.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, styles.infoButton]}
              onPress={() => router.replace('/community-matching' as const)}
            >
              <Text style={styles.primaryButtonText}>Start matching again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Graduation / Ended State */}
        {!isActive && (
          <View style={styles.graduationCard}>
            <View style={styles.graduationHeader}>
              <Text style={styles.graduationTitle}>🎉 Circle Completed!</Text>
              <Text style={styles.graduationSubtitle}>
                You've shared 14 days of growth. Keep the support going by following your circle mates.
              </Text>
            </View>
            
            <View style={styles.graduationMembers}>
              {members?.filter(m => m.user_id !== currentUser?.id).map((member) => (
                <View key={member.id} style={styles.graduationMemberRow}>
                  <TouchableOpacity
                    onPress={() => handleMemberPress(member.user_id)}
                    style={styles.graduationMemberInfo}
                  >
                    {member.user.profile_picture_url ? (
                      <Image
                        source={{ uri: member.user.profile_picture_url }}
                        style={styles.graduationAvatar}
                      />
                    ) : (
                      <View style={[styles.graduationAvatar, styles.avatarFallback]}>
                        <Text style={styles.avatarFallbackText}>
                          {member.user.username?.[0]?.toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                    <View>
                      <Text style={styles.graduationMemberName}>{member.user.username}</Text>
                      <Text style={styles.graduationMemberRole}>{formatPersonaLabel(circle.persona)}</Text>
                    </View>
                  </TouchableOpacity>
                  <FollowButton targetUserId={member.user_id} />
                </View>
              ))}
            </View>
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
              : "Hasn't joined chat yet";
          return (
            <View key={member.id} style={styles.memberRow}>
              <TouchableOpacity
                onPress={() => handleMemberPress(member.user_id)}
                style={styles.memberTouchable}
                disabled={isSelf}
              >
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
              </TouchableOpacity>
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
  countdownContainer: {
    marginTop: 10,
  },
  countdownBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff3e6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  countdownText: {
    color: '#ff820b',
    fontWeight: '600',
    fontSize: 14,
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
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
  },
  memberTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
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
    backgroundColor: '#ff9b3d',
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
  graduationCard: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  graduationHeader: {
    padding: 20,
    backgroundColor: '#F0F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
    gap: 8,
  },
  graduationTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0C4A6E',
    textAlign: 'center',
  },
  graduationSubtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
  },
  graduationMembers: {
    padding: 16,
    gap: 16,
  },
  graduationMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  graduationMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  graduationAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CBD5E1',
  },
  graduationMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  graduationMemberRole: {
    fontSize: 13,
    color: '#64748B',
  },
});
