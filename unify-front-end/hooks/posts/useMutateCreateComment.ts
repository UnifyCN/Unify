import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment } from '@/services/posts/createComment';
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
      return await createComment(postId, content, parentCommentId);
    },

    onSuccess: (_, { postId }) => {
      // Refresh the comments list
      queryClient.invalidateQueries({
        queryKey: ['post-comments', postId],
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
