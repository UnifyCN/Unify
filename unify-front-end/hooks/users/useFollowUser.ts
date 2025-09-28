import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followUser, FollowAction } from '@/services/users/followUser';

export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, FollowAction>({
    mutationFn: followUser,
    onSuccess: (_, variables) => {
      // Invalidate user info queries to update follower/following counts
      queryClient.invalidateQueries({ queryKey: ['userInfo'] });

      // Also invalidate the specific user's info if we have their ID
      queryClient.invalidateQueries({
        queryKey: ['userInfo', variables.targetUserId],
      });

      // Invalidate follow status cache to update button text immediately
      queryClient.invalidateQueries({
        queryKey: ['followStatus', variables.targetUserId],
      });

      // Invalidate following feed to update posts immediately
      queryClient.invalidateQueries({
        queryKey: ['feed', 'following'],
      });
    },
  });
};
