import { getAllPosts } from '@/services/posts/getAllPosts';
import { useFeedFactory } from '../feeds/useFeedFactory';

export const useAllPosts = () => {
  return useFeedFactory({
    queryKey: ['all-posts'],
    queryFn: getAllPosts,
  });
};
