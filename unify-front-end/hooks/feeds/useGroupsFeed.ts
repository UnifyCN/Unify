import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeedGroups } from '@/services/feeds/getGroupsFeed';
import { FeedResponse } from '@/types/feeds/feedResponse';

export const useGroupsFeed = () => {
  return useInfiniteQuery<
    FeedResponse,
    Error,
    FeedResponse,
    string[],
    string | undefined
  >({
    queryKey: ['feed', 'groups'],
    queryFn: ({ pageParam }) => getFeedGroups(pageParam),
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.next_cursor,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Usage in component:
// const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeedGroups()
//
// const allPosts = data?.pages.flatMap(page => page.posts) ?? []
