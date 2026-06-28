import { createDiscussion } from '@/services/discussions/createDiscussion';
import { useAnalytics } from '@/utils/analytics';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useMutateCreateDiscussion = () => {
  const queryClient = useQueryClient();
  const { trackDiscussionPostCreated, trackMutationFailed } = useAnalytics();

  return useMutation({
    mutationFn: createDiscussion,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['module-discussions', variables.moduleId],
      });
      queryClient.invalidateQueries({
        queryKey: ['module-discussion-stats', variables.moduleId],
      });

      trackDiscussionPostCreated({
        module_id: variables.moduleId,
        discussion_id: data?.id,
        submodule_id: variables.submoduleId ?? undefined,
        lesson_id: variables.lessonId ?? undefined,
        body_length: variables.body.length,
      });
    },
    onError: (error: Error) => {
      console.error('Error creating discussion:', error);
      trackMutationFailed({
        surface: 'discussion_create',
        error_message: error?.message,
      });
    },
  });
};
