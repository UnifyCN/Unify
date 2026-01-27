import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/context/UserContext';
import {
  getCircleById,
  getCircleMembers,
  getMembershipForCircle,
  leaveCircle,
} from '@/services/matching/circles';
import { fetchCircleMessages, sendCircleMessage } from '@/services/matching/messages';
import type {
  CommunityCircleMemberProfile,
  CommunityMessage,
} from '@/types/matching';
import { CircleMessageBubble } from '@/ui/communityMatching/CircleMessageBubble';
import { FollowButton } from '@/components/profile/FollowButton';
import { formatPersonaLabel, formatTimeInCanadaLabel } from '@/matching/pools';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import BackHeader from '@/components/BackHeader';


export default function CircleChatScreen() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList<CommunityMessage>>(null);
  
  // Presence tracking state
  const [onlineMembers, setOnlineMembers] = useState<Set<string>>(new Set());
  const [typingMembers, setTypingMembers] = useState<Set<string>>(new Set());
  const [selectedMember, setSelectedMember] = useState<CommunityCircleMemberProfile | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: circle } = useQuery({
    queryKey: ['community-circle', circleId],
    queryFn: () => getCircleById(circleId as string),
    enabled: !!circleId,
  });

  const { data: members } = useQuery({
    queryKey: ['community-circle-members', circleId],
    queryFn: () => getCircleMembers(circleId as string),
    enabled: !!circleId,
  });

  const { data: membership } = useQuery({
    queryKey: ['community-circle-membership', circleId],
    queryFn: () => getMembershipForCircle(circleId as string),
    enabled: !!circleId,
  });

  const memberLookup = useMemo(() => {
    const map: Record<string, CommunityCircleMemberProfile> = {};
    members?.forEach(member => {
      map[member.user_id] = member;
    });
    return map;
  }, [members]);

  useEffect(() => {
    let cancelled = false;
    const loadMessages = async () => {
      if (!circleId) return;
      try {
        const data = await fetchCircleMessages(circleId as string);
        if (!cancelled) {
          setMessages(data);
        }
      } catch (error) {
        console.error('Failed to load messages', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [circleId]);

  useEffect(() => {
    if (!circleId) return;
    
    const channel = supabase
      .channel(`community-messages-${circleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `circle_id=eq.${circleId}`,
        },
        payload => {
          // Avoid duplicates (in case optimistic update already added it)
          setMessages(prev => {
            const exists = prev.some(m => m.id === payload.new.id);
            if (exists) {
              return prev;
            }
            return [
              ...prev,
              {
                id: payload.new.id,
                circle_id: payload.new.circle_id,
                sender_user_id: payload.new.sender_user_id,
                content: payload.new.content,
                created_at: payload.new.created_at,
                sender: payload.new.sender_user_id
                  ? {
                      id: payload.new.sender_user_id,
                      username:
                        memberLookup[payload.new.sender_user_id]?.user
                          .username || 'Circle member',
                      profile_picture_url:
                        memberLookup[payload.new.sender_user_id]?.user
                          .profile_picture_url || null,
                    }
                  : null,
              },
            ];
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [circleId, memberLookup]);

  // Presence tracking for online status and typing indicators
  useEffect(() => {
    if (!circleId || !currentUser) return;

    const presenceChannel = supabase.channel(`presence-${circleId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const online = new Set<string>();
        const typing = new Set<string>();
        
        Object.values(state).forEach((users: unknown) => {
          const presenceUsers = users as Array<{ user_id?: string; is_typing?: boolean }>;
          presenceUsers.forEach((user) => {
            if (user.user_id && user.user_id !== currentUser.id) {
              online.add(user.user_id);
              if (user.is_typing) {
                typing.add(user.user_id);
              }
            }
          });
        });
        
        setOnlineMembers(online);
        setTypingMembers(typing);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: currentUser.id,
            username: currentUser.username,
            is_typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    presenceChannelRef.current = presenceChannel;

    return () => {
      supabase.removeChannel(presenceChannel);
      presenceChannelRef.current = null;
    };
  }, [circleId, currentUser]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !circleId || circle?.status === 'ended') {
      return;
    }
    
    // Clear input immediately for better UX
    setText('');
    setIsSending(true);
    
    // Optimistically add the message to the list
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: CommunityMessage = {
      id: tempId,
      circle_id: circleId as string,
      sender_user_id: currentUser?.id || '',
      content: trimmed,
      created_at: new Date().toISOString(),
      sender: currentUser ? {
        id: currentUser.id,
        username: currentUser.username || 'You',
        profile_picture_url: currentUser.profilePictureUrl || null,
      } : null,
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      await sendCircleMessage(circleId as string, trimmed);
      // The realtime subscription will handle updating the message with the real ID,
      // or the duplicate check will skip it if the temp message already exists.
      // We'll remove the temp message when the real one comes in.
    } catch (error) {
      console.error('Failed to send message', error);
      // Remove the optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      Alert.alert('Message not sent', 'Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleLeave = () => {
    if (!circleId) return;
    Alert.alert(
      'Leave this circle?',
      'Leaving will remove you from the chat immediately.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave circle',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveCircle(circleId as string);
              await queryClient.invalidateQueries({
                queryKey: ['community-active-circle'],
              });
              router.replace('/community-matching' as const);
            } catch (error) {
              console.error('Failed to leave circle', error);
              Alert.alert('Unable to leave', 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleMemberPress = (userId: string) => {
    const member = memberLookup[userId];
    if (member && member.user_id !== currentUser?.id) {
      setSelectedMember(member);
    }
  };

  const handleCloseModal = () => {
    setSelectedMember(null);
  };

  const viewFullProfile = () => {
    if (selectedMember) {
      handleCloseModal();
      router.push({
        pathname: '/profile',
        params: { userId: selectedMember.user_id } 
      });
    }
  };

  const renderItem = ({ item }: { item: CommunityMessage }) => {
    const isOwn = item.sender_user_id === currentUser?.id;
    return <CircleMessageBubble message={item} isOwn={isOwn} onPressSender={handleMemberPress} />;
  };

  // Handle text input with typing indicator broadcast
  const handleTextChange = (newText: string) => {
    setText(newText);
    
    // Broadcast typing status
    if (presenceChannelRef.current && currentUser) {
      presenceChannelRef.current.track({
        user_id: currentUser.id,
        username: currentUser.username,
        is_typing: newText.length > 0,
        online_at: new Date().toISOString(),
      });

      // Clear typing indicator after 2 seconds of inactivity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        if (presenceChannelRef.current && currentUser) {
          presenceChannelRef.current.track({
            user_id: currentUser.id,
            username: currentUser.username,
            is_typing: false,
            online_at: new Date().toISOString(),
          });
        }
      }, 2000);
    }
  };

  // Get typing member names for display
  const typingMemberNames = useMemo(() => {
    return Array.from(typingMembers)
      .map(id => memberLookup[id]?.user?.username)
      .filter(Boolean)
      .slice(0, 2);
  }, [typingMembers, memberLookup]);

  const inputDisabled =
    circle?.status === 'ended' || membership?.left_at !== null;


  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <BackHeader 
          title=""
          onBack={() => router.back()}
          rightButton={
            <TouchableOpacity onPress={handleLeave} style={styles.headerIcon}>
              <Feather name="more-horizontal" size={24} color="#6B7280" />
            </TouchableOpacity>
          }
        />

        {/* Online members presence bar - Make clickable */}
        {onlineMembers.size > 0 && (
          <View style={styles.presenceBar}>
            <View style={styles.presenceAvatars}>
              {members?.filter(m => onlineMembers.has(m.user_id)).slice(0, 4).map(member => (
                <TouchableOpacity 
                  key={member.user_id} 
                  style={styles.presenceAvatar}
                  onPress={() => handleMemberPress(member.user_id)}
                >
                  {member.user.profile_picture_url ? (
                    <Image 
                      source={{ uri: member.user.profile_picture_url }} 
                      style={styles.presenceAvatarImg} 
                    />
                  ) : (
                    <View style={[styles.presenceAvatarImg, styles.presenceAvatarFallback]}>
                      <Text style={styles.presenceAvatarText}>
                        {member.user.username?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.onlineDot} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.presenceText}>
              {onlineMembers.size} online
            </Text>
          </View>
        )}

        {circle?.status === 'ended' && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              This circle has ended. Chat is read-only.
            </Text>
          </View>
        )}
        {membership?.left_at && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              You left this circle. Messages are archived for reference.
            </Text>
          </View>
        )}
        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size='large' />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
               const isOwn = item.sender_user_id === currentUser?.id;
               return (
                 <CircleMessageBubble 
                   message={item} 
                   isOwn={isOwn} 
                   onPressSender={handleMemberPress}
                 />
               );
            }}
            contentContainerStyle={styles.messagesList}
          />
        )}

        {/* Typing indicator */}
        {typingMemberNames.length > 0 && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>
              {typingMemberNames.join(', ')} {typingMemberNames.length > 1 ? 'are' : 'is'} typing...
            </Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.input,
                inputDisabled && styles.inputDisabled,
              ]}
              placeholder='Message...'
              placeholderTextColor="#9CA3AF"
              value={text}
              onChangeText={handleTextChange}
              editable={!inputDisabled}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!text.trim() || inputDisabled) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!text.trim() || isSending || inputDisabled}
            >
              {isSending ? (
                <ActivityIndicator color='#fff' size="small" />
              ) : (
                <Feather name="arrow-up" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Member Identity Modal */}
      {selectedMember && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedMember}
          onRequestClose={handleCloseModal}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={handleCloseModal}
          >
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                {selectedMember.user.profile_picture_url ? (
                  <Image 
                    source={{ uri: selectedMember.user.profile_picture_url }} 
                    style={styles.modalAvatar} 
                  />
                ) : (
                  <View style={[styles.modalAvatar, styles.modalAvatarFallback]}>
                    <Text style={styles.modalAvatarText}>
                      {selectedMember.user.username?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.modalUserInfo}>
                  <Text style={styles.modalUsername}>{selectedMember.user.username}</Text>
                  <Text style={styles.modalRole}>{formatPersonaLabel(circle?.persona)}</Text>
                </View>
                <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseBtn}>
                  <Feather name="x" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.commonGroundSection}>
                <Text style={styles.commonGroundTitle}>Shared Journey</Text>
                <View style={styles.commonGroundItem}>
                  <Feather name="map-pin" size={16} color="#ff820b" />
                  <Text style={styles.commonGroundText}>
                    You both arrived in Canada <Text style={styles.highlight}>{formatTimeInCanadaLabel(circle?.time_in_canada)}</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.viewProfileBtn}
                  onPress={viewFullProfile}
                >
                  <Text style={styles.viewProfileText}>View Profile</Text>
                </TouchableOpacity>
                <View style={styles.modalFollowBtn}>
                  <FollowButton targetUserId={selectedMember.user_id} />
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
  },
  backText: {
    color: '#6E6E6E',
  },
  headerTitle: {
    fontWeight: '600',
    color: '#1F1300',
  },
  leaveText: {
    color: '#E74C3C',
    fontWeight: '600',
  },
  banner: {
    padding: 12,
    backgroundColor: '#FFF4E4',
    alignItems: 'center',
  },
  bannerText: {
    color: '#7C4A00',
    fontSize: 13,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    paddingVertical: 16,
    paddingBottom: 24,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#F3F4F6',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    padding: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff9b3d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  headerIcon: {
    padding: 4,
  },
  // Presence bar styles
  presenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
  },
  presenceAvatars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  presenceAvatar: {
    position: 'relative',
    marginRight: -6,
  },
  presenceAvatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
  },
  presenceAvatarFallback: {
    backgroundColor: '#ff9d40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presenceAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  },
  presenceText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#64748B',
  },
  // Typing indicator styles
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
  },
  typingText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
  },
  modalAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE0CC',
  },
  modalAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9A3412',
  },
  modalUserInfo: {
    flex: 1,
  },
  modalUsername: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  commonGroundSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  commonGroundTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  commonGroundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commonGroundText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  highlight: {
    fontWeight: '600',
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewProfileBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewProfileText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  modalFollowBtn: {
    flex: 1,
  },
});


