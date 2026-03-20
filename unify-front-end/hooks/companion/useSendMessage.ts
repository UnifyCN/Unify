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
import { useAnalytics } from '@/utils/analytics';

type SendMessageError = Error & {
  messagePersisted?: boolean;
};

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
  const [lastSuggestedNextSteps, setLastSuggestedNextSteps] = useState<
    string[] | undefined
  >(undefined);
  const [lastVerified, setLastVerified] = useState<string | undefined>(
    undefined
  );
  const { data: usage } = useChatbotUsage();
  const updateUsage = useUpdateChatbotUsage();
  const createConversation = useCreateConversation();
  const saveMessage = useSaveMessage();
  const { trackCompanionResponseReceived } = useAnalytics();

  const sendMessage = async (
    messageText: string,
    optimisticClientId?: string
  ): Promise<void> => {
    setIsLoading(true);
    setIsWaitingForBot(true);
    setLastSuggestedNextSteps(undefined);
    setLastVerified(undefined);
    let userMessagePersisted = false;

    try {
      let conversationIdToUse = currentConversationId;
      const isNewConversation = !conversationIdToUse;

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
          clientId: optimisticClientId,
        });
        userMessagePersisted = true;
      } catch (error) {
        console.error('Failed to save user message:', error);
        // Continue anyway - message will be saved but might not show immediately
      }

      // Format messages for RAG API (last 10 messages for context)
      const conversationMessages = formatMessagesForAPI(messages, messageText);

      // Call the Gemini API through Supabase edge function with conversation context
      const apiStartTime = Date.now();
      const response = await callGeminiAPI(
        messageText,
        conversationIdToUse,
        conversationMessages
      );
      const responseTimeMs = Date.now() - apiStartTime;

      // Update usage count only for non-premium users
      if (!isPremium) {
        const newMessageCount = (usage?.message_count ?? 0) + 1;
        updateUsage.mutate(newMessageCount);
      }

      // Parse the response (includes queryType, disclaimer, suggestedNextSteps, and tokenUsage)
      const {
        answer: botResponse,
        sources,
        queryType,
        disclaimer,
        suggestedNextSteps,
        lastVerified: responseLastVerified,
        tokenUsage,
        estimatedCostUsd,
      } = parseRAGResponse(response);

      // Track companion response with cost metrics
      trackCompanionResponseReceived({
        query_type: queryType || 'unknown',
        has_sources: sources.length > 0,
        prompt_tokens: tokenUsage?.prompt_tokens,
        completion_tokens: tokenUsage?.completion_tokens,
        total_tokens: tokenUsage?.total_tokens,
        estimated_cost_usd: estimatedCostUsd,
        response_time_ms: responseTimeMs,
      });

      // Store real-time-only fields for UI display (not persisted to DB)
      setLastSuggestedNextSteps(suggestedNextSteps);
      setLastVerified(responseLastVerified);

      // Save bot message to database
      // Note: queryType, disclaimer, and suggestedNextSteps are not persisted to DB
      // They're only used for immediate UI display
      try {
        await saveMessage.mutateAsync({
          conversationIdentifier: conversationIdToUse,
          role: 'assistant',
          content: botResponse,
          sources: sources.length > 0 ? sources : undefined,
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
      const sendError =
        error instanceof Error
          ? (error as SendMessageError)
          : (new Error(String(error)) as SendMessageError);
      sendError.messagePersisted = userMessagePersisted;
      throw sendError;
    } finally {
      setIsLoading(false);
      setIsWaitingForBot(false);
    }
  };

  return { sendMessage, isLoading, isWaitingForBot, lastSuggestedNextSteps, lastVerified };
};
