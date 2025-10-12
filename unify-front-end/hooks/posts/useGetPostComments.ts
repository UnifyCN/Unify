import { useQuery } from '@tanstack/react-query';
import { getPostComments, PostComment } from '@/services/posts/getPostComments';

export const useGetPostComments = (postId: number) => {
  return useQuery<PostComment[]>({
    queryKey: ['post-comments', postId],
    queryFn: () => getPostComments(postId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
