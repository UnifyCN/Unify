import { useMutation, useQueryClient } from '@tanstack/react-query';
import { blockUser } from '@/services/users/blockUser';
import { unblockUser } from '@/services/users/unblockUser';
import { invalidateBlockedUserIds } from '@/services/users/getBlockedUserIds';
import { useAnalytics } from '@/utils/analytics';

export const useMutateBlockUser = () => {
  const queryClient = useQueryClient();
  const { trackUserBlocked, trackUserUnblocked } = useAnalytics();

  const invalidateAll = () => {
    invalidateBlockedUserIds();
    queryClient.invalidateQueries({ queryKey: ['user-block-status'] });
    queryClient.invalidateQueries({ queryKey: ['feed'] });
  };

  const blockMutation = useMutation({
    mutationFn: (blockedUserId: string) => blockUser(blockedUserId),
    onSuccess: (_, blockedUserId) => {
      invalidateAll();
      trackUserBlocked(blockedUserId);
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (blockedUserId: string) => unblockUser(blockedUserId),
    onSuccess: (_, blockedUserId) => {
      invalidateAll();
      trackUserUnblocked(blockedUserId);
    },
  });

  return { blockMutation, unblockMutation };
};
