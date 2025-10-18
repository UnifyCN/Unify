import { getPostsFromJoinedGroups } from '@/services/feeds/getPostsFromJoinedGroups';
import { useFeedFactory } from './useFeedFactory';

export const useGroupsFeed = () => {
  return useFeedFactory({
    queryKey: ['feed', 'groups'],
    queryFn: getPostsFromJoinedGroups,
  });
};

// Usage in component:
// const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeedGroups()
//
// const allPosts = data?.pages.flatMap(page => page.posts) ?? []
