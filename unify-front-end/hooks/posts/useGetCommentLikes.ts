import { useQuery } from '@tanstack/react-query';
import { getCommentLikes } from '@/services/posts/getCommentLikes';

export const useGetCommentLikes = (commentId: number) => {
  return useQuery({
    queryKey: ['comment-likes', commentId],
    queryFn: () => getCommentLikes(commentId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};