import { useQuery } from '@tanstack/react-query';
import { getPostLikes } from '@/services/posts/getPostLikes';

export const useGetPostLikes = (postId: number) => {
  return useQuery({
    queryKey: ['post-likes', postId],
    queryFn: () => getPostLikes(postId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}; 