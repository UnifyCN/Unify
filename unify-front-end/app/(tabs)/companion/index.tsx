import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Keyboard,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useConversationMessages } from '@/hooks/companion/useConversationMessages';
import { useChatbotUsage } from '@/hooks/companion/useChatbotUsage';
import { useSendMessage } from '@/hooks/companion/useSendMessage';
import { useCurrentUser } from '@/context/UserContext';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
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
import BlueDottedLine from '@/assets/images/blue-dotted.svg';
import CompanionHeader from '@/components/CompanionHeader';
import { useFocusEffect } from '@react-navigation/native';
import { useAnalytics } from '@/utils/analytics';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

const MESSAGE_LIMIT = 3;
const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const dottedLineTopOffset = -windowHeight * 0.001;
const dottedLineWidth = windowWidth * 2.2;
const dottedLineHeight = windowHeight * 0.9;

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
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const {
    trackScreen,
    trackCompanionMessageSent,
    trackCompanionStarterPromptUsed,
    trackCompanionSuggestionClicked,
    trackCompanionHistoryViewed,
  } = useAnalytics();
  const lastTrackedRef = useRef<number>(0);

  // Track screen view on focus - with debounce to prevent duplicates
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastTrackedRef.current > 500) {
        trackScreen('Companion');
        lastTrackedRef.current = now;
      }
    }, [trackScreen])
  );

  // Current conversation ID (UUID) - either from query param or newly created
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  const [inputText, setInputText] = useState('');
  // Local greeting message shown when user clicks "Ask Anything"
  const [greetingMessage, setGreetingMessage] = useState<Message | null>(null);
  const emptyStateTopPadding = Math.max(
    190,
    (windowHeight - insets.top - insets.bottom) * 0.47
  );

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

  const { data: usage } = useChatbotUsage();
  const { currentUser } = useCurrentUser();
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
  const showLoadingState =
    isLoadingMessages || (isLoading && messages.length === 0);
  const showEmptyState = !showLoadingState && messages.length === 0;

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
    trackCompanionMessageSent(textToSend.length);

    try {
      await sendMessage(textToSend);
    } catch (error) {
      // Error is already logged in useSendMessage hook
    }
  };

  // Handle starter prompt selection
  const handleStarterPromptSelect = (prompt: string, mode?: string) => {
    // Track the starter prompt usage (empty prompt defaults to 'Ask Anything')
    trackCompanionStarterPromptUsed(prompt || 'Ask Anything', mode);

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
    trackCompanionSuggestionClicked(suggestion);
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
    <Pressable style={styles.container} onPress={Keyboard.dismiss}>
      <View style={styles.contentWrapper}>
        {/* Header */}
        <CompanionHeader
          title='AI Companion'
          showBackButton={false}
          rightButton={
            <TouchableOpacity
              onPress={() => {
                router.push('/(tabs)/companion/history' as any);
                trackCompanionHistoryViewed();
              }}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <HistoryIcon width={20} height={20} />
            </TouchableOpacity>
          }
        />

        {/* Messages - takes up available space */}
        {showLoadingState ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size='large' color={Theme.surfaceBlue} />
          </View>
        ) : showEmptyState ? (
          <View
            style={[styles.emptyState, { paddingTop: emptyStateTopPadding }]}
          >
            <View style={styles.dottedLineContainer} pointerEvents='none'>
              <BlueDottedLine
                width={dottedLineWidth}
                height={dottedLineHeight}
              />
            </View>
            <Text style={styles.heroTitle}>
              I'm here to simplify your journey.
            </Text>
            <Text style={styles.heroSubtitle}>How can I help you?</Text>
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
            keyboardShouldPersistTaps='handled'
          />
        )}
      </View>

      <KeyboardStickyView
        style={styles.stickyContainer}
        offset={{
          closed: 0,
          opened: insets.bottom + tabBarHeight - 12,
        }}
      >
        <View style={styles.bottomSection}>
          {/* Starter Prompts - Only show when no messages and no greeting */}
          {showEmptyState && (
            <StarterPrompts onPromptSelect={handleStarterPromptSelect} />
          )}

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
      </KeyboardStickyView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.white,
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
  emptyState: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  dottedLineContainer: {
    position: 'absolute',
    width: dottedLineWidth,
    height: dottedLineHeight,
    top: dottedLineTopOffset,
    left: -windowWidth * 0.65,
    opacity: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Theme.black,
    lineHeight: 30,
  },
  heroSubtitle: {
    fontSize: 20,
    fontWeight: '400',
    color: Theme.textInput,
    marginTop: 6,
    lineHeight: 22,
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
  },
  stickyContainer: {
    backgroundColor: '#fff',
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 14,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  headerButton: {
    padding: 4,
  },
  disclaimerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  disclaimerText: {
    fontSize: 12,
    color: Theme.textInput,
    textAlign: 'center',
  },
});
