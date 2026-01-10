import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteComment } from '@/services/posts/deleteComment';
import { useInvalidatePostMetadata } from '@/hooks/usePostMetadata';

export const useMutateDeleteComment = () => {
  const queryClient = useQueryClient();
  const { invalidatePostMetadata } = useInvalidatePostMetadata();

  return useMutation({
    mutationFn: async ({
      commentId,
      postId,
    }: {
      commentId: number;
      postId: number;
    }) => {
      return await deleteComment(commentId);
    },
    onSuccess: (_, { postId }) => {
      // Invalidate comments for the post
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });

      // Invalidate post metadata to update comment count
      invalidatePostMetadata(postId);

      // Invalidate feed queries that might show comment counts
      queryClient.invalidateQueries({ queryKey: ['feed', 'forYou'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'following'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'groups'] });
    },
    onError: error => {
      console.error('Error deleting comment:', error);
    },
  });
};
