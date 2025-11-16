import { useQuery } from '@tanstack/react-query';
import {
  getConversationMessages,
  ConversationMessage,
} from '@/services/companion/getConversationMessages';

export const useConversationMessages = (
  conversationIdentifier: string | null
) => {
  return useQuery<ConversationMessage[]>({
    queryKey: ['conversation-messages', conversationIdentifier],
    queryFn: () => {
      if (!conversationIdentifier) {
        throw new Error('Conversation identifier is required');
      }
      return getConversationMessages(conversationIdentifier);
    },
    enabled: !!conversationIdentifier,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
