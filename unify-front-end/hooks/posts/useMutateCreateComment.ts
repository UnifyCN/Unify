import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment } from '@/services/posts/createComment';
import { useInvalidatePostMetadata } from '@/hooks/usePostMetadata';
import { updatePostAcrossCaches } from '@/utils/updatePostCaches';
import { useAnalytics } from '@/utils/analytics';

export const useMutateCreateComment = () => {
  const queryClient = useQueryClient();
  const { invalidatePostMetadata } = useInvalidatePostMetadata();
  const { trackCommentCreated, trackMutationFailed } = useAnalytics();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
      parentCommentId,
    }: {
      postId: number;
      content: string;
      parentCommentId?: number | null;
    }) => {
      return await createComment(postId, content, parentCommentId);
    },

    onSuccess: (data: any, { postId, content, parentCommentId }) => {
      updatePostAcrossCaches(queryClient, postId, post => ({
        ...post,
        commentCount: (post.commentCount ?? 0) + 1,
      }));

      // Refresh the comments list
      queryClient.invalidateQueries({
        queryKey: ['post-comments', postId],
      });

      queryClient.resetQueries({
        queryKey: ['feed', 'commentedOn'],
      });

      // Invalidate only the specific post's metadata (more efficient)
      invalidatePostMetadata(postId);

      trackCommentCreated({
        post_id: String(postId),
        comment_id: data?.id ? String(data.id) : undefined,
        is_reply: parentCommentId != null,
        ...(parentCommentId != null && {
          parent_comment_id: String(parentCommentId),
        }),
        body_length: content.length,
      });
    },

    onError: (error: any) => {
      console.error('Error creating comment:', error);
      trackMutationFailed({
        surface: 'comment_create',
        error_message: error?.message,
      });
    },
  });
};

// Usage in component:
// const createCommentMutation = useMutateCreateComment();

// const handleCreateComment = () => {
//   if (commentText.trim() === '') return;
//   createCommentMutation.mutate({
//     postId: post.id,
//     content: commentText,
//   });
// };
