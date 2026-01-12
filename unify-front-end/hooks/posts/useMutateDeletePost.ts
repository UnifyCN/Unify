import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePost } from '@/services/posts/deletePost';
import { useInvalidatePostMetadata } from '@/hooks/usePostMetadata';

export const useMutateDeletePost = () => {
  const queryClient = useQueryClient();
  const { invalidatePostMetadata } = useInvalidatePostMetadata();

  return useMutation({
    mutationFn: async (postId: number) => {
      return await deletePost(postId);
    },
    onSuccess: (_, postId) => {
      // Invalidate all post-related queries
      queryClient.invalidateQueries({ queryKey: ['feed', 'forYou'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'following'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'groups'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'savedPosts'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'commentedOn'] });
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      // Invalidate post metadata
      invalidatePostMetadata(postId);
    },
    onError: error => {
      console.error('Error deleting post:', error);
    },
  });
};
