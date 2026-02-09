import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  saveMessage,
  SaveMessageParams,
} from '@/services/companion/saveMessage';
import { ConversationMessage } from '@/services/companion/getConversationMessages';

interface SaveMessageContext {
  previousMessages?: ConversationMessage[];
}

export const useSaveMessage = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, SaveMessageParams, SaveMessageContext>({
    mutationFn: (params: SaveMessageParams) => saveMessage(params),
    onMutate: async variables => {
      const queryKey = [
        'conversation-messages',
        variables.conversationIdentifier,
      ] as const;

      await queryClient.cancelQueries({ queryKey });

      const previousMessages =
        queryClient.getQueryData<ConversationMessage[]>(queryKey);

      const optimisticMessage: ConversationMessage = {
        id: -Date.now() - Math.floor(Math.random() * 1000),
        role: variables.role,
        content: variables.content,
        sources: variables.sources ?? null,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<ConversationMessage[]>(
        queryKey,
        current => [...(current ?? []), optimisticMessage]
      );

      return { previousMessages };
    },
    onSuccess: () => {
      // Keep conversation list fresh (updated_at/title changes)
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      });
    },
    onError: (error, variables, context) => {
      const queryKey = [
        'conversation-messages',
        variables.conversationIdentifier,
      ] as const;

      if (context?.previousMessages) {
        queryClient.setQueryData(queryKey, context.previousMessages);
      }

      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      });

      console.error('Failed to save message:', error);
    },
  });
};
