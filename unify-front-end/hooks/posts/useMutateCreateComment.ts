import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPostComment } from '@/services/posts/createPostComment';
import { useInvalidatePostMetadata } from '@/hooks/usePostMetadata';

export const useMutateCreateComment = () => {
  const queryClient = useQueryClient();
  const { invalidatePostMetadata } = useInvalidatePostMetadata();

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

    onSuccess: (_, { postId }) => {
      // Refresh the comments list
      queryClient.invalidateQueries({
        queryKey: ['post-comments', postId],
      });

      queryClient.resetQueries({
        queryKey: ['feed', 'commentedOn'],
      });

      // Invalidate only the specific post's metadata (more efficient)
      invalidatePostMetadata(postId);
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
