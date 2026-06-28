import {
  deleteDiscussion,
  deleteDiscussionReply,
} from '@/services/discussions/deleteDiscussion';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useMutateDeleteDiscussion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      discussionId,
      moduleId,
    }: {
      discussionId: string;
      moduleId: string;
    }) => deleteDiscussion(discussionId),
    onSuccess: (_, { moduleId }) => {
      queryClient.invalidateQueries({
        queryKey: ['module-discussions', moduleId],
      });
      queryClient.invalidateQueries({
        queryKey: ['module-discussion-stats', moduleId],
      });
    },
    onError: error => {
      console.error('Error deleting discussion:', error);
    },
  });
};

export const useMutateDeleteDiscussionReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      replyId,
      discussionId,
      moduleId,
    }: {
      replyId: string;
      discussionId: string;
      moduleId: string;
    }) => deleteDiscussionReply(replyId),
    onSuccess: (_, { discussionId, moduleId }) => {
      queryClient.invalidateQueries({
        queryKey: ['discussion-replies', discussionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['module-discussions', moduleId],
      });
      queryClient.invalidateQueries({
        queryKey: ['module-discussion-stats', moduleId],
      });
    },
    onError: error => {
      console.error('Error deleting discussion reply:', error);
    },
  });
};
