import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserPosts } from '@/services/posts/getUserPosts';
import { FeedResponse } from '@/types/feeds/feedResponse';

export const useUserPosts = (userId: string) => {
  return useInfiniteQuery<
    FeedResponse,
    Error,
    FeedResponse,
    string[],
    string | undefined
  >({
    queryKey: ['userPosts', userId],
    queryFn: ({ pageParam }) => getUserPosts(userId, pageParam),
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.next_cursor,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
