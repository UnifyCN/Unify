import { useQuery } from '@tanstack/react-query';
import { getAllPosts } from '@/services/posts/getAllPosts';
import { useInfiniteQuery } from '@tanstack/react-query';

export const useAllPosts = () => {
  return useInfiniteQuery({
    queryKey: ['all-posts'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getAllPosts(pageParam),
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.next_cursor,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
