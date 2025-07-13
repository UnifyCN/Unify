import { useInfiniteQuery } from '@tanstack/react-query'
import { getFeedForYou } from '@/services/feeds/getForYouFeed'
import { FeedResponse } from '@/types/feeds/feedResponse'

export const useForYouFeed = () => {
  return useInfiniteQuery<FeedResponse, Error, FeedResponse, string[], string | undefined>({
    queryKey: ['feed', 'forYou'],
    queryFn: ({ pageParam }) => getFeedForYou(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Usage in component:
// const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeedForYou()
// 
// const allPosts = data?.pages.flatMap(page => page.posts) ?? []
