import { getForYouFeed } from '@/services/feeds/getForYouFeed';
import { useFeedFactory } from './useFeedFactory';

export const useForYouFeed = (limit: number = 20) => {
  return useFeedFactory({
    queryKey: ['feed', 'forYou'],
    queryFn: getForYouFeed,
    limit,
  });
};

// Usage in component:
// const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeedForYou()
//
// const allPosts = data?.pages.flatMap(page => page.posts) ?? []
