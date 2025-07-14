import { useInfiniteQuery } from '@tanstack/react-query';
import { getSavedPosts } from '@/services/posts/getSavedPosts';

export const useGetSavedPosts = () => {
  return useInfiniteQuery({
    queryKey: ['saved-posts'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => getSavedPosts(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}; 