import { useInfiniteQuery } from '@tanstack/react-query'
import { getFeedFollowing } from '@/services/feeds/getFollowingFeed'
import { FeedResponse } from '@/types/feeds/feedResponse'

export const useFollowingFeed = () => {
  return useInfiniteQuery<FeedResponse, Error, FeedResponse, string[], string | undefined>({
    queryKey: ['feed', 'following'],
    queryFn: ({ pageParam }) => getFeedFollowing(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Usage in component:
// const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeedFollowing()
// 
// const allPosts = data?.pages.flatMap(page => page.posts) ?? []