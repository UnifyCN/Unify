import { useQuery } from '@tanstack/react-query';
import { getFollowing } from '@/services/users/getFollowing';

export const useFollowing = (userId: string) => {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: () => getFollowing(userId),
    enabled: !!userId,
  });
};
