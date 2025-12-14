import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
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
} from '@/services/matching/circles';
import { fetchCircleMessages, sendCircleMessage } from '@/services/matching/messages';
import type {
  CommunityCircle,
  CommunityCircleMemberProfile,
  CommunityMessage,
} from '@/types/matching';
import { CircleMessageBubble } from '@/ui/communityMatching/CircleMessageBubble';
import { formatPersonaLabel } from '@/matching/pools';
import { supabase } from '@/lib/supabase';

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
          setMessages(prev => [
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
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [circleId, memberLookup]);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !circleId || circle?.status === 'ended') {
      return;
    }
    setIsSending(true);
    try {
      await sendCircleMessage(circleId as string, trimmed);
      setText('');
    } catch (error) {
      console.error('Failed to send message', error);
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

  const renderItem = ({ item }: { item: CommunityMessage }) => {
    const isOwn = item.sender_user_id === currentUser?.id;
    return <CircleMessageBubble message={item} isOwn={isOwn} />;
  };

  const inputDisabled =
    circle?.status === 'ended' || membership?.left_at !== null;

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>‹ Circle</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {formatPersonaLabel(circle?.persona)} chat
          </Text>
          <TouchableOpacity onPress={handleLeave}>
            <Text style={styles.leaveText}>Leave</Text>
          </TouchableOpacity>
        </View>
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
            renderItem={renderItem}
            contentContainerStyle={styles.messagesList}
          />
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              inputDisabled && styles.inputDisabled,
            ]}
            placeholder='Say hello...'
            value={text}
            onChangeText={setText}
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
              <ActivityIndicator color='#fff' />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
  },
  sendButton: {
    backgroundColor: '#FF7A18',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#FEB58A',
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
  },
});
