import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPostComment } from '@/services/posts/createPostComment';
import { useInvalidatePostMetadata } from '@/hooks/usePostMetadata';
import { useInvalidatePostCommentMetadata } from '../usePostCommentMetadata';

export const useMutateCreateComment = () => {
  const queryClient = useQueryClient();
  const { invalidatePostMetadata } = useInvalidatePostMetadata();
  const { invalidatePostCommentMetadata } = useInvalidatePostCommentMetadata();

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
      return await createPostComment(postId, content, parentCommentId);
    },

    onSuccess: (_, variables) => {
      const { postId, parentCommentId } = variables;

      queryClient.invalidateQueries({
        queryKey: ['post-comments', postId],
      });

      queryClient.resetQueries({
        queryKey: ['feed', 'commentedOn'],
      });

      invalidatePostMetadata(postId);

      if (parentCommentId) {
        queryClient.invalidateQueries({
          queryKey: ['post-replies', parentCommentId],
        });

        invalidatePostCommentMetadata(parentCommentId);
      }
    },

    onError: error => {
      console.error('Error creating comment:', error);
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
