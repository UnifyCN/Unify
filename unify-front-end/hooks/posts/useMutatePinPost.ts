import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pinPost } from '@/services/posts/pinPost';
import { unpinPost } from '@/services/posts/unpinPost';

interface PinPostParams {
  postId: number;
  isPinned: boolean; // Current state - if true, we unpin; if false, we pin
}

export const useMutatePinPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isPinned }: PinPostParams) => {
      if (isPinned) {
        await unpinPost(postId);
      } else {
        await pinPost(postId);
      }
    },
    onSuccess: () => {
      // Invalidate For You feed to refetch with new pin order
      queryClient.invalidateQueries({ queryKey: ['feed', 'forYou'] });
    },
    onError: (error) => {
      console.error('Error toggling pin status:', error);
    },
  });
};
