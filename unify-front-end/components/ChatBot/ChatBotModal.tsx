import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isGeminiAvailable, callGeminiAPI } from '@/utils/gemini';
import { useChatbotUsage } from '@/hooks/chatbot/useChatbotUsage';
import { useUpdateChatbotUsage } from '@/hooks/chatbot/useUpdateChatbotUsage';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatBotModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ChatBotModal = ({ visible, onClose }: ChatBotModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const { data: usage, isLoading: isLoadingUsage } = useChatbotUsage();
  const updateUsage = useUpdateChatbotUsage();

  const MESSAGE_LIMIT = 3; // Daily message limit, applicable to everyone but could be changed/ignored for premium members in the future
  const messagesLeft = MESSAGE_LIMIT - usage?.message_count!;
  const canSendMessage = messagesLeft > 0;

  // Check API availability and initialize with appropriate message
  useEffect(() => {
    if (visible && messages.length === 0) {
      const apiAvailable = isGeminiAvailable();

      if (!apiAvailable) {
        setIsApiAvailable(false);
        setMessages([
          {
            id: '1',
            text: '⚠️ Chat Assistant is currently unavailable. Please check again later.',
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      } else {
        setIsApiAvailable(true);
        setMessages([
          {
            id: '1',
            text: "Hello! I'm here to help you. How can I assist you today?",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
    }
  }, [visible]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || !isApiAvailable || !canSendMessage)
      return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Call the Gemini API through Supabase edge function
      const response = await callGeminiAPI(userMessage.text);

      const newMessageCount = (usage?.message_count ?? 0) + 1;
      updateUsage.mutate(newMessageCount);

      // Extract the response text from the Gemini API response
      let botResponse = 'Sorry, I encountered an error. Please try again.';

      if (response && response.candidates && response.candidates[0]) {
        const candidate = response.candidates[0];
        if (
          candidate.content &&
          candidate.content.parts &&
          candidate.content.parts[0]
        ) {
          botResponse = candidate.content.parts[0].text;
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Gemini API error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.botMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isUser ? styles.userText : styles.botText,
          ]}
        >
          {item.text}
        </Text>
      </View>
    </View>
  );

  const renderLoadingIndicator = () => {
    if (!isLoading) return null;

    return (
      <View style={[styles.messageContainer, styles.botMessage]}>
        <View style={[styles.messageBubble, styles.botBubble]}>
          <View style={styles.typingIndicator}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='fullScreen'
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              AI Companion {!isApiAvailable && '⚠️'}
            </Text>
            {!isApiAvailable && (
              <Text style={styles.headerSubtitle}>Temporarily Unavailable</Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name='close' size={24} color='#333' />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={renderLoadingIndicator}
        />

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
              (!isApiAvailable || !canSendMessage) && styles.disabledInput,
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              !isApiAvailable
                ? 'Chat unavailable'
                : !canSendMessage
                  ? 'Daily limit reached'
                  : 'Type your message...'
            }
            placeholderTextColor='#999'
            multiline
            maxLength={500}
            editable={!isLoading && isApiAvailable && canSendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() ||
                isLoading ||
                !isApiAvailable ||
                !canSendMessage) &&
                styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={
              !inputText.trim() ||
              isLoading ||
              !isApiAvailable ||
              !canSendMessage
            }
          >
            <Ionicons
              name='send'
              size={20}
              color={
                !inputText.trim() ||
                isLoading ||
                !isApiAvailable ||
                !canSendMessage
                  ? '#ccc'
                  : '#fff'
              }
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 2,
  },
  closeButton: {
    padding: 5,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  messageContainer: {
    marginVertical: 5,
    flexDirection: 'row',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 5,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#333',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 2,
    opacity: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingBottom: 40,
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
    backgroundColor: '#f9f9f9',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#999',
    opacity: 0.6,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  messageCountContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
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
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
});
