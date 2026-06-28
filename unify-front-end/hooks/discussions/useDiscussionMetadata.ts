import {
  getDiscussionMetadataBatch,
  getDiscussionReplyMetadataBatch,
} from '@/services/discussions/discussionMetadata';
import {
  DiscussionMetadata,
  DiscussionReplyMetadata,
} from '@/types/learn/moduleDiscussion';
import { useQuery } from '@tanstack/react-query';

export const useDiscussionMetadata = (discussionIds: string[]) => {
  return useQuery<Record<string, DiscussionMetadata>>({
    queryKey: ['discussion-metadata', discussionIds],
    queryFn: () => getDiscussionMetadataBatch(discussionIds),
    enabled: discussionIds.length > 0,
    staleTime: 1000 * 30,
  });
};

export const useDiscussionReplyMetadata = (replyIds: string[]) => {
  return useQuery<Record<string, DiscussionReplyMetadata>>({
    queryKey: ['discussion-reply-metadata', replyIds],
    queryFn: () => getDiscussionReplyMetadataBatch(replyIds),
    enabled: replyIds.length > 0,
    staleTime: 1000 * 30,
  });
};
