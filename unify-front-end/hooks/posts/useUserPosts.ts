import { getUserPosts } from '@/services/posts/getUserPosts';
import { useFeedFactoryWithParams } from '../feeds/useFeedFactory';

export const useUserPosts = (userId: string, limit: number = 20) => {
  return useFeedFactoryWithParams({
    queryKey: ['userPosts'],
    queryFn: (params, pageParam, limitParam) =>
      getUserPosts(params, pageParam, limitParam || limit),
    params: userId,
    limit,
  });
};
