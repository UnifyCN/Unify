import { useInfiniteQuery } from '@tanstack/react-query';
import { getForYouFeed } from '@/services/feeds/getForYouFeed';

export const useForYouFeed = () => {
  return useInfiniteQuery({
    queryKey: ['feed', 'forYou'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getForYouFeed(pageParam),
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.next_cursor,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Usage in component:
// const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeedForYou()
//
// const allPosts = data?.pages.flatMap(page => page.posts) ?? []
