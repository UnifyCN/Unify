import { useQuery } from '@tanstack/react-query';
import { getPostLikes } from '@/services/posts/getPostLikes';

export const usePostLikes = (postId: number) => {
  return useQuery({
    queryKey: ['post-likes', postId],
    queryFn: () => getPostLikes(postId),
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!postId, // Only run if postId exists
  });
}; 