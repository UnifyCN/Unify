import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Keyboard,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { History, Plus } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useConversationMessages } from '@/hooks/companion/useConversationMessages';
import { useChatbotUsage } from '@/hooks/companion/useChatbotUsage';
import { useCompanionReviewPrompt } from '@/hooks/companion/useCompanionReviewPrompt';
import { useSendMessage } from '@/hooks/companion/useSendMessage';
import { useCurrentUser } from '@/context/UserContext';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  formatMessagesForUI,
  Message,
} from '@/helpers/companion/messageHelpers';
import { MessageWithSources } from '@/components/companion/MessageWithSources';
import { TypingIndicator } from '@/components/companion/TypingIndicator';
import { StarterPrompts } from '@/components/companion/StarterPrompts';
import { Theme } from '@/constants/Theme';
import { TAB_HEADER_METRICS } from '@/constants/TabHeader';
import SendIcon from '@/components/icons/SendIcon.svg';
import { AnimatedDottedBackground } from '@/components/companion/AnimatedDottedBackground';
import CompanionHeader from '@/components/CompanionHeader';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAnalytics } from '@/utils/analytics';
import { usePersonalizedStarters } from '@/hooks/companion/usePersonalizedStarters';
import { AICompanionBusyError } from '@/utils/gemini';
import { useToast } from '@/context/ToastContext';

const MESSAGE_LIMIT = 6;
const OPTIMISTIC_MESSAGE_MATCH_WINDOW_MS = 5000;
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
  const { t } = useTranslation();
  const { data: personalization } = usePersonalizedStarters();
  const { conversationId } = useLocalSearchParams<{
    conversationId?: string;
  }>();
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const { showToast } = useToast();
  const { height: kbHeight, progress: kbProgress } =
    useReanimatedKeyboardAnimation();
  const bottomAnimatedStyle = useAnimatedStyle(() => {
    // kbHeight is negative when keyboard is open, 0 when closed.
    // Add tabBarHeight only while keyboard is open to compensate for the tab bar
    // that the keyboard covers.
    const tabBarCompensation = kbProgress.value * tabBarHeight;
    return {
      transform: [{ translateY: kbHeight.value + tabBarCompensation }],
    };
  });
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
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  // Fetch messages for the current conversation
  const { data: dbMessages, isLoading: isLoadingMessages } =
    useConversationMessages(currentConversationId);

  // Convert database messages to UI Message format
  const dbMessagesFormatted = useMemo(
    () => formatMessagesForUI(dbMessages),
    [dbMessages]
  );

  const visibleOptimisticMessages = useMemo(
    () =>
      optimisticMessages.filter(
        optimisticMessage =>
          !dbMessagesFormatted.some(persistedMessage => {
            if (
              persistedMessage.clientId &&
              optimisticMessage.clientId &&
              persistedMessage.clientId === optimisticMessage.clientId
            ) {
              return true;
            }

            return (
              persistedMessage.isUser === optimisticMessage.isUser &&
              persistedMessage.text === optimisticMessage.text &&
              Math.abs(
                persistedMessage.timestamp.getTime() -
                  optimisticMessage.timestamp.getTime()
              ) <= OPTIMISTIC_MESSAGE_MATCH_WINDOW_MS
            );
          })
      ),
    [dbMessagesFormatted, optimisticMessages]
  );

  // Combine greeting message with real messages
  const messages: Message[] = useMemo(
    () =>
      (greetingMessage
        ? [
            greetingMessage,
            ...dbMessagesFormatted,
            ...visibleOptimisticMessages,
          ]
        : [...dbMessagesFormatted, ...visibleOptimisticMessages]
      ).sort(
        (left, right) => left.timestamp.getTime() - right.timestamp.getTime()
      ),
    [greetingMessage, dbMessagesFormatted, visibleOptimisticMessages]
  );

  // Clear greeting when real messages exist
  useEffect(() => {
    if (dbMessagesFormatted.length > 0 && greetingMessage) {
      setGreetingMessage(null);
    }
  }, [dbMessagesFormatted.length, greetingMessage]);

  const flatListRef = useRef<FlatList<Message>>(null);
  // Ref for the text input to handle focusing
  const inputRef = useRef<TextInput>(null);
  const previousMessageCountRef = useRef<number>(0);

  const { data: usage } = useChatbotUsage();
  const { currentUser } = useCurrentUser();
  const isPremium = currentUser?.isPremium ?? false;
  const {
    sendMessage,
    isLoading,
    isWaitingForBot,
    lastSuggestedNextSteps,
    lastVerified,
    streamingBotMessage,
  } = useSendMessage({
    messages,
    currentConversationId,
    setCurrentConversationId,
    isPremium,
  });

  const messageCount = usage?.message_count ?? 0;
  useCompanionReviewPrompt(usage?.message_count);
  const messagesLeft = getMessagesLeft(messageCount, MESSAGE_LIMIT);
  const canSend = canSendMessage(isPremium, messagesLeft);
  const sendButtonDisabled = isSendButtonDisabled(
    inputText,
    isLoading,
    canSend
  );
  // Render the in-flight streaming bot bubble at the bottom of the list while
  // tokens are arriving. Once the message is persisted, useSendMessage clears
  // streamingBotMessage and the saved copy from the React Query cache takes
  // over — no flicker, no duplicate.
  const displayMessages: Message[] = useMemo(
    () =>
      streamingBotMessage ? [...messages, streamingBotMessage] : messages,
    [messages, streamingBotMessage]
  );
  const showLoadingState =
    displayMessages.length === 0 && (isLoadingMessages || isLoading);
  const showEmptyState = !showLoadingState && displayMessages.length === 0;

  const resetDraftState = useCallback(() => {
    setOptimisticMessages([]);
    setGreetingMessage(null);
    setInputText('');
  }, []);

  // Initialize conversation ID from query params if it exists, or clear it for new conversation
  useEffect(() => {
    if (conversationId && typeof conversationId === 'string') {
      setCurrentConversationId(conversationId);
    } else {
      // Clear conversation ID when starting a new conversation (no conversationId param)
      setCurrentConversationId(null);
    }
    resetDraftState();
    previousMessageCountRef.current = 0;
  }, [conversationId, resetDraftState]);

  // Scroll to end only when new messages are added (not when sources expand/collapse)
  useEffect(() => {
    const currentMessageCount = displayMessages.length;
    const previousMessageCount = previousMessageCountRef.current;

    // Only scroll if message count increased (new message added)
    if (currentMessageCount > previousMessageCount && currentMessageCount > 0) {
      // Use setTimeout to ensure the layout has updated
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }

    previousMessageCountRef.current = currentMessageCount;
  }, [displayMessages.length]);

  const handleSendMessage = useCallback(
    async (messageText?: string) => {
      const textToSend = messageText || inputText.trim();
      if (!textToSend || isLoading || !canSend) return;

      let optimisticMessageId: string | null = null;
      if (!currentConversationId) {
        optimisticMessageId = `optimistic-user-${Date.now()}`;
        const optimisticMessage: Message = {
          id: optimisticMessageId,
          clientId: optimisticMessageId,
          text: textToSend,
          isUser: true,
          timestamp: new Date(),
        };
        setOptimisticMessages(current => [...current, optimisticMessage]);
      }

      setInputText('');
      trackCompanionMessageSent(textToSend.length);

      try {
        await sendMessage(textToSend, optimisticMessageId ?? undefined);
      } catch (error) {
        if (optimisticMessageId) {
          setOptimisticMessages(current =>
            current.filter(message => message.id !== optimisticMessageId)
          );
        }
        if (
          !(error instanceof Error) ||
          !(error as Error & { messagePersisted?: boolean }).messagePersisted
        ) {
          setInputText(textToSend);
        }
        if (error instanceof AICompanionBusyError) {
          showToast(error.message);
        }
      }
    },
    [
      inputText,
      isLoading,
      canSend,
      sendMessage,
      trackCompanionMessageSent,
      currentConversationId,
      setOptimisticMessages,
      showToast,
    ]
  );

  // Handle starter prompt selection
  const handleStarterPromptSelect = (
    prompt: string,
    mode?: string,
    isPersonalized?: boolean
  ) => {
    // Track the starter prompt usage (empty prompt defaults to 'Ask Anything')
    trackCompanionStarterPromptUsed(
      prompt || 'Ask Anything',
      mode,
      isPersonalized
    );

    // "Ask Anything" - show bot greeting message
    if (prompt === '' && !mode) {
      const greeting: Message = {
        id: 'greeting-' + Date.now(),
        text: t('companion.greeting'),
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
        text: t('companion.formGreeting'),
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
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      trackCompanionSuggestionClicked(suggestion);
      handleSendMessage(suggestion);
    },
    [trackCompanionSuggestionClicked, handleSendMessage]
  );

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      // Only show suggestions and lastVerified on the last bot message
      const isLastMessage = index === displayMessages.length - 1;
      const isLastBotMessage = isLastMessage && !item.isUser;
      // Suppress chips while a token stream is still mid-flight — only show
      // suggestions on the *settled* final bot message.
      const showSuggestions =
        isLastBotMessage && !streamingBotMessage && lastSuggestedNextSteps;

      // Attach lastVerified to the last bot message for real-time display
      const displayItem =
        isLastBotMessage && lastVerified ? { ...item, lastVerified } : item;

      return (
        <MessageWithSources
          item={displayItem}
          suggestedNextSteps={
            showSuggestions ? lastSuggestedNextSteps : undefined
          }
          onSuggestionPress={handleSuggestionClick}
        />
      );
    },
    [
      displayMessages.length,
      streamingBotMessage,
      lastSuggestedNextSteps,
      lastVerified,
      handleSuggestionClick,
    ]
  );

  const renderLoadingIndicator = useCallback(() => {
    // Only show typing indicator when waiting for bot response (not when saving user message)
    if (!isWaitingForBot) return null;
    return <TypingIndicator />;
  }, [isWaitingForBot]);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const handleNewChatPress = useCallback(() => {
    setCurrentConversationId(null);
    resetDraftState();
    previousMessageCountRef.current = 0;
    Keyboard.dismiss();
    router.replace('/(tabs)/companion' as any);
  }, [resetDraftState, router]);

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* Header */}
        <CompanionHeader
          title={t('companion.title')}
          showBackButton={false}
          leftButton={
            <Pressable
              onPress={() => {
                router.push('/(tabs)/companion/history' as any);
                trackCompanionHistoryViewed();
              }}
              accessibilityRole='button'
              accessibilityLabel={t('companion.openHistory')}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed,
              ]}
            >
              <History
                color='#000'
                size={TAB_HEADER_METRICS.iconSize}
                strokeWidth={TAB_HEADER_METRICS.iconStrokeWidth}
                absoluteStrokeWidth
              />
            </Pressable>
          }
          rightButton={
            <Pressable
              onPress={handleNewChatPress}
              accessibilityRole='button'
              accessibilityLabel={t('companion.newChat')}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed,
              ]}
            >
              <Plus
                color='#000'
                size={TAB_HEADER_METRICS.iconSize}
                strokeWidth={TAB_HEADER_METRICS.iconStrokeWidth}
                absoluteStrokeWidth
              />
            </Pressable>
          }
        />

        {/* Messages - takes up available space */}
        {showLoadingState ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size='large' color={Theme.surfaceBlue} />
          </View>
        ) : showEmptyState ? (
          <View style={styles.emptyState}>
            <View style={styles.dottedLineContainer} pointerEvents='none'>
              <AnimatedDottedBackground
                width={dottedLineWidth}
                height={dottedLineHeight}
              />
            </View>
            <Text style={styles.welcomeTitle}>
              {t('companion.welcomeTitle')}
            </Text>
            <Text style={styles.welcomeCaption}>
              {t('companion.welcomeCaption')}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            ListFooterComponent={renderLoadingIndicator}
            keyboardShouldPersistTaps='handled'
            keyboardDismissMode='interactive'
            initialNumToRender={10}
            maxToRenderPerBatch={8}
            windowSize={7}
            updateCellsBatchingPeriod={50}
            nestedScrollEnabled={Platform.OS === 'android'}
            // Keep clipping disabled to avoid truncation/scroll lock for long rich bot responses on Android.
            // Repro observed in Companion screen after response render with dynamic markdown content.
            removeClippedSubviews={false}
          />
        )}
      </View>

      <Animated.View style={[styles.stickyContainer, bottomAnimatedStyle]}>
        <View style={styles.bottomSection}>
          {/* Starter Prompts - Only show when no messages and no greeting */}
          {showEmptyState && (
            <>
              <Text style={styles.startersLabel}>
                {t('companion.tryOneOfThese')}
              </Text>
              <StarterPrompts
                onPromptSelect={handleStarterPromptSelect}
                personalizedStarters={personalization?.starters}
              />
            </>
          )}

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, !canSend && styles.disabledInput]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                canSend ? t('companion.inputPlaceholder') : t('companion.dailyLimitReached')
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
              {t('companion.disclaimer')}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
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
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  dottedLineContainer: {
    position: 'absolute',
    width: dottedLineWidth,
    height: dottedLineHeight,
    top: dottedLineTopOffset,
    left: -windowWidth * 0.65,
    opacity: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.black,
    lineHeight: 26,
  },
  welcomeCaption: {
    fontSize: 20,
    fontWeight: '400',
    color: Theme.textInput,
    lineHeight: 26,
    marginTop: 6,
  },
  startersLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.textInput,
    paddingHorizontal: 20,
    paddingTop: 14,
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
    width: TAB_HEADER_METRICS.actionSize,
    height: TAB_HEADER_METRICS.actionSize,
    borderRadius: TAB_HEADER_METRICS.actionSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonPressed: {
    opacity: 0.7,
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
