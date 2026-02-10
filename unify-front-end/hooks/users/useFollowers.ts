import { useQuery } from '@tanstack/react-query';
import { getFollowers } from '@/services/users/getFollowers';

export const useFollowers = (userId: string) => {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: () => getFollowers(userId),
    enabled: !!userId,
  });
};
