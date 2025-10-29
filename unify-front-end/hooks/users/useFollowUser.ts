import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followUser, FollowAction } from '@/services/users/followUser';

export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, FollowAction>({
    mutationFn: followUser,
    onSuccess: (_, variables) => {
      const targetUserId = variables.targetUserId;

      queryClient.resetQueries({
        queryKey: ['userInfo'],
      });

      // Invalidate *exact* user info query
      queryClient.resetQueries({
        queryKey: ['userInfo', targetUserId],
      });

      // Invalidate follow status cache to update button text immediately
      queryClient.invalidateQueries({
        queryKey: ['followStatus', variables.targetUserId],
      });

      // Invalidate following feed to update posts immediately
      queryClient.resetQueries({
        queryKey: ['feed', 'following'],
      });
    },
  });
};
