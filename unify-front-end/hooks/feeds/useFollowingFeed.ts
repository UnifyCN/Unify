import { getFeedFollowing } from '@/services/feeds/getFollowingFeed';
import { useFeedFactory } from './useFeedFactory';

export const useFollowingFeed = (limit: number = 20) => {
  return useFeedFactory({
    queryKey: ['feed', 'following'],
    queryFn: getFeedFollowing,
    limit,
  });
};

// Usage in component:
// const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeedFollowing()
//
// const allPosts = data?.pages.flatMap(page => page.posts) ?? []
