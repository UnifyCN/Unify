import { createDiscussionReply } from '@/services/discussions/createDiscussionReply';
import { useAnalytics } from '@/utils/analytics';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useMutateCreateDiscussionReply = () => {
  const queryClient = useQueryClient();
  const { trackDiscussionReplyCreated, trackMutationFailed } = useAnalytics();

  return useMutation({
    mutationFn: async ({
      discussionId,
      body,
      moduleId,
    }: {
      discussionId: string;
      body: string;
      moduleId: string;
    }) => createDiscussionReply(discussionId, body),
    onSuccess: (data, { discussionId, body, moduleId }) => {
      queryClient.invalidateQueries({
        queryKey: ['discussion-replies', discussionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['module-discussions', moduleId],
      });
      queryClient.invalidateQueries({
        queryKey: ['module-discussion-stats', moduleId],
      });
      queryClient.invalidateQueries({
        queryKey: ['discussion-metadata'],
      });

      trackDiscussionReplyCreated({
        module_id: moduleId,
        discussion_id: discussionId,
        reply_id: data?.id,
        body_length: body.length,
      });
    },
    onError: (error: Error) => {
      console.error('Error creating discussion reply:', error);
      trackMutationFailed({
        surface: 'discussion_reply_create',
        error_message: error?.message,
      });
    },
  });
};
