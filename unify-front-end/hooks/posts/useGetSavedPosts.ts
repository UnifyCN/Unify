import { getSavedPosts } from '@/services/posts/getSavedPosts';
import { useFeedFactory } from '../feeds/useFeedFactory';

export const useGetSavedPosts = (limit: number = 20) => {
  return useFeedFactory({
    queryKey: ['feed', 'savedPosts'],
    queryFn: getSavedPosts,
    limit,
  });
};
