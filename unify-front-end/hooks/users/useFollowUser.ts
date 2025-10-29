import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followUser, FollowAction } from '@/services/users/followUser';

export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, FollowAction>({
    mutationFn: followUser,
    onSuccess: (_, variables) => {
      const targetUserId = variables.targetUserId;

      // Invalidate user info queries to update follower counts
      queryClient.invalidateQueries({
        queryKey: ['userInfo'],
      });

      // Invalidate specific user info query
      queryClient.invalidateQueries({
        queryKey: ['userInfo', targetUserId],
      });

      // Invalidate follow status cache
      queryClient.invalidateQueries({
        queryKey: ['followStatus', variables.targetUserId],
      });

      // Invalidate following feed to update posts
      queryClient.invalidateQueries({
        queryKey: ['feed', 'following'],
      });
    },
  });
};
