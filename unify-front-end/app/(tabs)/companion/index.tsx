import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useConversationMessages } from '@/hooks/companion/useConversationMessages';
import { useChatbotUsage } from '@/hooks/companion/useChatbotUsage';
import { useSendMessage } from '@/hooks/companion/useSendMessage';
import {
  formatMessagesForUI,
  Message,
} from '@/helpers/companion/messageHelpers';
import { MessageWithSources } from '@/components/companion/MessageWithSources';
import { TypingIndicator } from '@/components/companion/TypingIndicator';
import { Theme } from '@/constants/Theme';
import SendIcon from '@/components/icons/SendIcon.svg';
import HistoryIcon from '@/components/icons/HistoryIcon.svg';
import BackHeader from '@/components/BackHeader';

export default function CompanionScreen() {
  const { conversationId } = useLocalSearchParams<{
    conversationId?: string;
  }>();
  const router = useRouter();

  // Current conversation ID (UUID) - either from query param or newly created
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  // Fetch messages for the current conversation
  const { data: dbMessages, isLoading: isLoadingMessages } =
    useConversationMessages(currentConversationId);

  // Convert database messages to UI Message format
  const messages = formatMessagesForUI(dbMessages);

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const previousMessageCountRef = useRef<number>(0);

  const { data: usage, isLoading: isLoadingUsage } = useChatbotUsage();
  const { sendMessage, isLoading, isWaitingForBot } = useSendMessage({
    messages,
    currentConversationId,
    setCurrentConversationId,
  });

  const MESSAGE_LIMIT = 3;
  const messageCount = usage?.message_count ?? 0;
  const messagesLeft = Math.max(0, MESSAGE_LIMIT - messageCount);
  const canSendMessage = messagesLeft > 0;

  // Initialize conversation ID from query params if it exists, or clear it for new conversation
  useEffect(() => {
    if (conversationId && typeof conversationId === 'string') {
      setCurrentConversationId(conversationId);
    } else {
      // Clear conversation ID when starting a new conversation (no conversationId param)
      setCurrentConversationId(null);
    }
  }, [conversationId]);

  // Scroll to end only when new messages are added (not when sources expand/collapse)
  useEffect(() => {
    const currentMessageCount = messages.length;
    const previousMessageCount = previousMessageCountRef.current;

    // Only scroll if message count increased (new message added)
    if (currentMessageCount > previousMessageCount && currentMessageCount > 0) {
      // Use setTimeout to ensure the layout has updated
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }

    previousMessageCountRef.current = currentMessageCount;
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || !canSendMessage) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      await sendMessage(messageText);
    } catch (error) {
      // Error is already logged in useSendMessage hook
      // Could show user-friendly error message here if needed
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageWithSources item={item} />
  );

  const renderLoadingIndicator = () => {
    // Only show typing indicator when waiting for bot response (not when saving user message)
    if (!isWaitingForBot) return null;
    return <TypingIndicator />;
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.contentWrapper}>
          {/* Header */}
          <BackHeader
            title='AI Companion'
            rightButton={
              <TouchableOpacity
                onPress={() => {
                  router.push('/(tabs)/companion/history' as any);
                }}
                style={styles.headerButton}
              >
                <HistoryIcon width={24} height={24} />
              </TouchableOpacity>
            }
          />

          {/* Messages - takes up available space */}
          {isLoadingMessages || (isLoading && messages.length === 0) ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size='large' color={Theme.surfaceBlue} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyMessage}>
                Hey there, how can I help?
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              ListFooterComponent={renderLoadingIndicator}
            />
          )}

          {/* Bottom section - pushed to bottom with marginTop: auto */}
          <View style={styles.bottomSection}>
            {/* Message Count Display */}
            <View style={styles.messageCountContainer}>
              <Text
                style={[
                  styles.messageCountText,
                  messagesLeft <= 0 && styles.messageCountTextWarning,
                ]}
              >
                {isLoadingUsage
                  ? 'Loading...'
                  : `${messagesLeft}/${MESSAGE_LIMIT} messages left today`}
              </Text>
            </View>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  !canSendMessage && styles.disabledInput,
                ]}
                value={inputText}
                onChangeText={setInputText}
                placeholder={
                  !canSendMessage
                    ? 'Daily limit reached'
                    : 'Type your message...'
                }
                placeholderTextColor='#999'
                multiline
                maxLength={500}
                editable={!isLoading && canSendMessage}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading || !canSendMessage) &&
                    styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isLoading || !canSendMessage}
              >
                <View style={styles.sendIconContainer}>
                  <SendIcon
                    width={20}
                    height={18}
                    stroke={
                      !inputText.trim() || isLoading || !canSendMessage
                        ? Theme.textInactiveTab
                        : Theme.white
                    }
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerText}>
                AI Companion can make mistakes, check important info.
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.backgroundChatbot,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessage: {
    fontSize: 24,
    color: Theme.black,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 18,
    gap: 4,
    paddingVertical: 10,
  },
  bottomSection: {
    backgroundColor: '#fff',
    marginTop: 'auto',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 6,
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    minHeight: 44,
    backgroundColor: Theme.surfaceTextInput,
    color: Theme.black,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#999',
    opacity: 0.6,
  },
  sendButton: {
    backgroundColor: Theme.surfaceBlue,
    width: 38,
    height: 38,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  sendIconContainer: {
    width: 25,
    paddingLeft: 2,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageCountContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  messageCountText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  messageCountTextWarning: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  headerButton: {
    padding: 4,
  },
  disclaimerContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  disclaimerText: {
    fontSize: 12,
    color: Theme.textInput,
    textAlign: 'center',
  },
});
