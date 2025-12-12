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
import { useCurrentUser } from '@/context/UserContext';
import {
  formatMessagesForUI,
  Message,
} from '@/helpers/companion/messageHelpers';
import { MessageWithSources } from '@/components/companion/MessageWithSources';
import { TypingIndicator } from '@/components/companion/TypingIndicator';
import { StarterPrompts } from '@/components/companion/StarterPrompts';
import { Theme } from '@/constants/Theme';
import SendIcon from '@/components/icons/SendIcon.svg';
import HistoryIcon from '@/components/icons/HistoryIcon.svg';
import CompanionHeader from '@/components/CompanionHeader';

const MESSAGE_LIMIT = 3;

// Helper functions
const getMessagesLeft = (
  messageCount: number,
  messageLimit: number
): number => {
  return Math.max(0, messageLimit - messageCount);
};

const canSendMessage = (isPremium: boolean, messagesLeft: number): boolean => {
  return isPremium || messagesLeft > 0;
};

const getMessageCountText = (
  isLoadingUsage: boolean,
  isLoadingUser: boolean,
  isPremium: boolean,
  messagesLeft: number,
  messageLimit: number
): string => {
  if (isLoadingUsage || isLoadingUser) {
    return 'Loading...';
  }
  if (isPremium) {
    return 'Unlimited messages';
  }
  return `${messagesLeft}/${messageLimit} messages left today`;
};

const shouldShowWarning = (
  messagesLeft: number,
  isPremium: boolean
): boolean => {
  return messagesLeft <= 0 && !isPremium;
};

const isSendButtonDisabled = (
  inputText: string,
  isLoading: boolean,
  canSend: boolean
): boolean => {
  return !inputText.trim() || isLoading || !canSend;
};

export default function CompanionScreen() {
  const { conversationId } = useLocalSearchParams<{
    conversationId?: string;
  }>();
  const router = useRouter();

  // Current conversation ID (UUID) - either from query param or newly created
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  const [inputText, setInputText] = useState('');
  // Local greeting message shown when user clicks "Ask Anything"
  const [greetingMessage, setGreetingMessage] = useState<Message | null>(null);

  // Fetch messages for the current conversation
  const { data: dbMessages, isLoading: isLoadingMessages } =
    useConversationMessages(currentConversationId);

  // Convert database messages to UI Message format
  const dbMessagesFormatted = formatMessagesForUI(dbMessages);

  // Combine greeting message with real messages
  const messages: Message[] = greetingMessage
    ? [greetingMessage, ...dbMessagesFormatted]
    : dbMessagesFormatted;

  // Clear greeting when real messages exist
  useEffect(() => {
    if (dbMessagesFormatted.length > 0 && greetingMessage) {
      setGreetingMessage(null);
    }
  }, [dbMessagesFormatted.length, greetingMessage]);

  const flatListRef = useRef<FlatList>(null);
  // Ref for the text input to handle focusing
  const inputRef = useRef<TextInput>(null);
  const previousMessageCountRef = useRef<number>(0);

  const { data: usage, isLoading: isLoadingUsage } = useChatbotUsage();
  const { currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const isPremium = currentUser?.isPremium ?? false;
  const { sendMessage, isLoading, isWaitingForBot, lastSuggestedNextSteps } =
    useSendMessage({
      messages,
      currentConversationId,
      setCurrentConversationId,
      isPremium,
    });

  const messageCount = usage?.message_count ?? 0;
  const messagesLeft = getMessagesLeft(messageCount, MESSAGE_LIMIT);
  const canSend = canSendMessage(isPremium, messagesLeft);
  const sendButtonDisabled = isSendButtonDisabled(
    inputText,
    isLoading,
    canSend
  );

  // Initialize conversation ID from query params if it exists, or clear it for new conversation
  useEffect(() => {
    if (conversationId && typeof conversationId === 'string') {
      setCurrentConversationId(conversationId);
    } else {
      // Clear conversation ID when starting a new conversation (no conversationId param)
      setCurrentConversationId(null);
    }
    previousMessageCountRef.current = 0;
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

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || isLoading || !canSend) return;

    setInputText('');

    try {
      await sendMessage(textToSend);
    } catch (error) {
      // Error is already logged in useSendMessage hook
    }
  };

  // Handle starter prompt selection
  const handleStarterPromptSelect = (prompt: string, mode?: string) => {
    // "Ask Anything" - show bot greeting message
    if (prompt === '' && !mode) {
      const greeting: Message = {
        id: 'greeting-' + Date.now(),
        text: 'Hey there, how can I help?',
        isUser: false,
        timestamp: new Date(),
      };
      setGreetingMessage(greeting);
      // Focus input so user can type their question
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    // "Form Help" - show bot message asking which form
    if (mode === 'form_help') {
      const formGreeting: Message = {
        id: 'form-greeting-' + Date.now(),
        text: 'Which form are you working on?',
        isUser: false,
        timestamp: new Date(),
      };
      setGreetingMessage(formGreeting);
      // Focus input so user can type the form name
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    // For fact check, pre-fill the input so user can complete the sentence
    if (mode === 'fact_check') {
      setInputText(prompt);
      // Focus input after setting text so user can type immediately
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    // For other prompts, send directly
    handleSendMessage(prompt);
  };

  // Handle suggested next step click
  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    // Only show suggestions on the last bot message
    const isLastMessage = index === messages.length - 1;
    const showSuggestions =
      isLastMessage && !item.isUser && lastSuggestedNextSteps;

    return (
      <MessageWithSources
        item={item}
        suggestedNextSteps={
          showSuggestions ? lastSuggestedNextSteps : undefined
        }
        onSuggestionPress={handleSuggestionClick}
      />
    );
  };

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
          <CompanionHeader
            title='AI Companion'
            showBackButton={false}
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

          {/* Context sentence - only show when no messages */}
          {messages.length === 0 && !greetingMessage && !isLoadingMessages && (
            <View style={styles.contextContainer}>
              <Text style={styles.contextText}>
                Ask questions, check facts, or get help with forms.
              </Text>
            </View>
          )}

          {/* Messages - takes up available space */}
          {isLoadingMessages || (isLoading && messages.length === 0) ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size='large' color={Theme.surfaceBlue} />
            </View>
          ) : messages.length === 0 && !greetingMessage ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyMessage}>
                How can I help you today?
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
            {/* Starter Prompts - Only show when no messages and no greeting */}
            {messages.length === 0 &&
              !greetingMessage &&
              !isLoadingMessages && (
                <StarterPrompts onPromptSelect={handleStarterPromptSelect} />
              )}

            {/* Message Count Display */}
            <View style={styles.messageCountContainer}>
              <Text
                style={[
                  styles.messageCountText,
                  shouldShowWarning(messagesLeft, isPremium) &&
                    styles.messageCountTextWarning,
                ]}
              >
                {getMessageCountText(
                  isLoadingUsage,
                  isLoadingUser,
                  isPremium,
                  messagesLeft,
                  MESSAGE_LIMIT
                )}
              </Text>
            </View>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={[styles.textInput, !canSend && styles.disabledInput]}
                value={inputText}
                onChangeText={setInputText}
                placeholder={
                  canSend ? 'Type your message...' : 'Daily limit reached'
                }
                placeholderTextColor='#999'
                multiline
                maxLength={500}
                editable={!isLoading && canSend}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  sendButtonDisabled && styles.sendButtonDisabled,
                ]}
                onPress={() => handleSendMessage()}
                disabled={sendButtonDisabled}
              >
                <View style={styles.sendIconContainer}>
                  <SendIcon
                    width={20}
                    height={18}
                    stroke={
                      sendButtonDisabled ? Theme.textInactiveTab : Theme.white
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
    backgroundColor: Theme.white,
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
    paddingHorizontal: 20,
  },
  emptyMessage: {
    fontSize: 20,
    fontWeight: '400',
    color: Theme.black,
    textAlign: 'center',
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
  contextContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 4,
    maxWidth: '100%',
  },
  contextText: {
    fontSize: 14,
    color: Theme.textInput,
    textAlign: 'center',
    lineHeight: 20,
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
