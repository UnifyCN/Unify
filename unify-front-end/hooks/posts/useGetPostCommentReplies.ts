import { getReplies } from '@/services/posts/getPostCommentReplies';
import { PostCommentData } from '@/types/feeds/postcomment';
import { useQuery } from '@tanstack/react-query';

export const useGetPostCommentReplies = (commentId: number) => {
  return useQuery<PostCommentData[]>({
    queryKey: ['post-comments', commentId],
    queryFn: () => getReplies(commentId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
