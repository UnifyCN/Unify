import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment } from '@/services/posts/createComment';

export const useMutateCreateComment = () => {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({
        queryKey: ['post-comments', postId],
      });
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
