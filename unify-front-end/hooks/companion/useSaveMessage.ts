import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  saveMessage,
  SaveMessageParams,
} from '@/services/companion/saveMessage';

export const useSaveMessage = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, SaveMessageParams>({
    mutationFn: (params: SaveMessageParams) => saveMessage(params),
    onSuccess: (_, variables) => {
      // Invalidate messages for this conversation to refetch and show new message
      queryClient.invalidateQueries({
        queryKey: ['conversation-messages', variables.conversationIdentifier],
      });

      // Also invalidate conversations list to update updated_at timestamp
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      });
    },
    onError: error => {
      console.error('Failed to save message:', error);
    },
  });
};
