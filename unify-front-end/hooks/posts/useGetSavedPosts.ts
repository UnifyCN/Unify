import { getSavedPosts } from '@/services/posts/getSavedPosts';
import { useFeedFactory } from '../feeds/useFeedFactory';

export const useGetSavedPosts = () => {
  return useFeedFactory({
    queryKey: ['feed', 'savedPosts'],
    queryFn: getSavedPosts,
  });
};
