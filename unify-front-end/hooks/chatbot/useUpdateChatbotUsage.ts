import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertChatbotUsage } from '../../services/chatbot/upsertChatbotUsage';

export const useUpdateChatbotUsage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (new_message_count: number) =>
      upsertChatbotUsage(new_message_count),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['chatbot-usage'],
      });
    },
  });
};
