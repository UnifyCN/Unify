import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportPost } from '@/services/posts/reportPost';
import { reportUser } from '@/services/users/reportUser';

export const useMutateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      userId,
      isReported,
      reason,
      type = 'post',
    }: {
      postId?: number;
      userId?: string;
      isReported: boolean;
      reason: string;
      type?: 'post' | 'user';
    }) => {
      if (type === 'post' && postId) {
        return await reportPost(postId, reason);
      } else if (type === 'user' && userId) {
        return await reportUser(userId, reason);
      }

      throw new Error('Missing postId or userId');
    },
    onError: err => {
      console.error('Report mutation error:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-metadata'] });
    },
  });
};
