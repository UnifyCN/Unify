import { useQuery } from '@tanstack/react-query';
import { getChatbotUsage } from '@/services/companion/getChatbotUsage';
import { ChatbotUsage } from '@/types/chatbot';

export const useChatbotUsage = () => {
  return useQuery<ChatbotUsage>({
    queryKey: ['chatbot-usage'],
    queryFn: () => getChatbotUsage(),
  });
};
