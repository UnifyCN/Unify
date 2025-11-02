import { getPostReplies } from '@/services/posts/getPostReplies';
import { PostCommentData } from '@/types/feeds/postcomment';
import { useQuery } from '@tanstack/react-query';

// TODO: may not need this hook
export const useGetPostReplies = (commentId: number) => {
  return useQuery<PostCommentData[]>({
    queryKey: ['post-comments', commentId],
    queryFn: () => getPostReplies(commentId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
