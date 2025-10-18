import { getUserPosts } from '@/services/posts/getUserPosts';
import { useFeedFactoryWithParams } from '../feeds/useFeedFactory';

export const useUserPosts = (userId: string) => {
  return useFeedFactoryWithParams({
    queryKey: ['userPosts'],
    queryFn: (params, pageParam) => getUserPosts(params, pageParam),
    params: userId,
  });
};
