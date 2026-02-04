import { getPostComments } from '@/services/posts/getPostComments';
import { PostCommentData } from '@/types/feeds/postcomment';
import { useQuery } from '@tanstack/react-query';

export const useGetPostComments = (postId?: number) => {
  return useQuery<PostCommentData[]>({
    queryKey: ['post-comments', postId ?? 'unknown'],
    queryFn: () => getPostComments(postId as number),
    enabled: typeof postId === 'number' && postId > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
