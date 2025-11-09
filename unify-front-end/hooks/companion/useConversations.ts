import { useQuery } from '@tanstack/react-query';
import {
  getConversations,
  Conversation,
} from '@/services/companion/getConversations';

export const useConversations = () => {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => getConversations(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
