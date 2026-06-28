import { getDiscussionReplies } from '@/services/discussions/getDiscussionReplies';
import { DiscussionReplyData } from '@/types/learn/moduleDiscussion';
import { useQuery } from '@tanstack/react-query';

export const useGetDiscussionReplies = (discussionId?: string) => {
  return useQuery<DiscussionReplyData[]>({
    queryKey: ['discussion-replies', discussionId ?? 'unknown'],
    queryFn: () => getDiscussionReplies(discussionId as string),
    enabled: !!discussionId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
};
