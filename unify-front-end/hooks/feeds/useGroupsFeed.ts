import { getPostsFromJoinedGroups } from '@/services/feeds/getPostsFromJoinedGroups';
import { useFeedFactory } from './useFeedFactory';

export const useGroupsFeed = (limit: number = 20) => {
  return useFeedFactory({
    queryKey: ['feed', 'groups'],
    queryFn: getPostsFromJoinedGroups,
    limit,
  });
};

// Usage in component:
// const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeedGroups()
//
// const allPosts = data?.pages.flatMap(page => page.posts) ?? []
