import { useQuery } from '@tanstack/react-query';
import { getUserInfo, UserInfo } from '@/services/users/getUserInfo';

export const useUserInfo = (userId?: string) => {
  return useQuery<UserInfo, Error>({
    queryKey: ['userInfo', userId],
    queryFn: () => getUserInfo(userId),
    enabled: !!userId, // Only fetch when userId is provided
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
