import { useInfiniteQuery } from '@tanstack/react-query';
import { getPostsByGroup } from '@/services/posts/getPostsByGroup';
import { FeedResponse } from '@/types/feeds/feedResponse';

export const useGroupPosts = (group_id?: number | string) => {
  return useInfiniteQuery<FeedResponse, Error, FeedResponse, string[]>({
    queryKey: ['group', 'posts', String(group_id)],
    queryFn: ({ pageParam }) =>
      getPostsByGroup(group_id as any, pageParam as string | undefined),
    enabled: Boolean(group_id),
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.next_cursor,
    staleTime: 1000 * 60 * 2,
  });
};
