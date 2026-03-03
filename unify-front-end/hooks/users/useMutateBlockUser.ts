import { useMutation, useQueryClient } from '@tanstack/react-query';
import { blockUser } from '@/services/users/blockUser';
import { unblockUser } from '@/services/users/unblockUser';
import { invalidateBlockedUserIds } from '@/services/users/getBlockedUserIds';

export const useMutateBlockUser = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    invalidateBlockedUserIds();
    queryClient.invalidateQueries({ queryKey: ['user-block-status'] });
    queryClient.invalidateQueries({ queryKey: ['feed'] });
  };

  const blockMutation = useMutation({
    mutationFn: (blockedUserId: string) => blockUser(blockedUserId),
    onSuccess: () => invalidateAll(),
  });

  const unblockMutation = useMutation({
    mutationFn: (blockedUserId: string) => unblockUser(blockedUserId),
    onSuccess: () => invalidateAll(),
  });

  return { blockMutation, unblockMutation };
};
