import { useQuery } from '@tanstack/react-query';
import { getFollowStatus } from '@/services/users/getFollowStatus';

export const useFollowStatus = (targetUserId: string) => {
  return useQuery<boolean, Error>({
    queryKey: ['followStatus', targetUserId],
    queryFn: () => getFollowStatus(targetUserId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
