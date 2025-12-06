import { useState } from 'react';
import { callGeminiAPI } from '@/utils/gemini';
import { useChatbotUsage } from '@/hooks/companion/useChatbotUsage';
import { useUpdateChatbotUsage } from '@/hooks/companion/useUpdateChatbotUsage';
import { useCreateConversation } from '@/hooks/companion/useCreateConversation';
import { useSaveMessage } from '@/hooks/companion/useSaveMessage';
import {
  Message,
  formatMessagesForAPI,
  parseRAGResponse,
} from '@/helpers/companion/messageHelpers';

interface UseSendMessageParams {
  messages: Message[];
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  isPremium: boolean;
}

export const useSendMessage = ({
  messages,
  currentConversationId,
  setCurrentConversationId,
  isPremium,
}: UseSendMessageParams) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForBot, setIsWaitingForBot] = useState(false);
  const [lastSuggestedNextSteps, setLastSuggestedNextSteps] = useState<string[] | undefined>(undefined);
  const { data: usage } = useChatbotUsage();
  const updateUsage = useUpdateChatbotUsage();
  const createConversation = useCreateConversation();
  const saveMessage = useSaveMessage();

  const sendMessage = async (messageText: string): Promise<void> => {
    setIsLoading(true);

    try {
      let conversationIdToUse = currentConversationId;

      // If no conversation exists yet, create a new one with title generated from first message
      if (!conversationIdToUse) {
        try {
          const newConversation = await createConversation.mutateAsync({
            firstMessage: messageText,
          });
          conversationIdToUse = newConversation.conversation_identifier;
          setCurrentConversationId(conversationIdToUse);
        } catch (error) {
          console.error('Failed to create conversation:', error);
          setIsLoading(false);
          throw error;
        }
      }

      // Save user message to database
      try {
        await saveMessage.mutateAsync({
          conversationIdentifier: conversationIdToUse,
          role: 'user',
          content: messageText,
        });
        // Wait a bit for the query to refetch and show the user's message
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Failed to save user message:', error);
        // Continue anyway - message will be saved but might not show immediately
      }

      // Now show typing indicator - user's message should be visible
      setIsWaitingForBot(true);

      // Format messages for RAG API (last 10 messages for context)
      const conversationMessages = formatMessagesForAPI(messages, messageText);

      // Call the Gemini API through Supabase edge function with conversation context
      const response = await callGeminiAPI(
        messageText,
        conversationIdToUse,
        conversationMessages
      );

      // Update usage count only for non-premium users
      if (!isPremium) {
        const newMessageCount = (usage?.message_count ?? 0) + 1;
        updateUsage.mutate(newMessageCount);
      }

      // Parse the response (now includes queryType, disclaimer, and suggestedNextSteps)
      const { answer: botResponse, sources, queryType, disclaimer, suggestedNextSteps } =
        parseRAGResponse(response);

      // Store suggested next steps for UI display (not persisted to DB)
      setLastSuggestedNextSteps(suggestedNextSteps);

      // Save bot message to database
      // Note: suggestedNextSteps is not persisted to DB, only used for immediate UI display
      try {
        await saveMessage.mutateAsync({
          conversationIdentifier: conversationIdToUse,
          role: 'assistant',
          content: botResponse,
          sources: sources.length > 0 ? sources : undefined,
          queryType,
          disclaimer,
          suggestedNextSteps,
        });
      } catch (error) {
        console.error('Failed to save bot message:', error);
        // Continue anyway - message will be saved but might not show immediately
      }

      // Messages will automatically refetch due to query invalidation in useSaveMessage hook
    } catch (error) {
      console.error('Gemini API error:', error);
      console.error(
        'Error details:',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    } finally {
      setIsLoading(false);
      setIsWaitingForBot(false);
    }
  };

  return { sendMessage, isLoading, isWaitingForBot, lastSuggestedNextSteps };
};
