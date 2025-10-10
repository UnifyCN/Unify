import { useInfiniteQuery } from '@tanstack/react-query';
import { getPostsByGroup } from '@/services/posts/getPostsByGroup';
import { FeedResponse } from '@/types/feeds/feedResponse';

export const useGroupPosts = (groupId?: number | string) => {
  return useInfiniteQuery<FeedResponse, Error, FeedResponse, string[]>({
    queryKey: ['group', 'posts', String(groupId)],
    queryFn: ({ pageParam }) =>
      getPostsByGroup(groupId as any, pageParam as string | undefined),
    enabled: Boolean(groupId),
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.next_cursor,
    staleTime: 1000 * 60 * 2,
  });
};
