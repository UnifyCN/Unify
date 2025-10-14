import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface CommentMetadata {
  commentId: number;
  isLiked: boolean;
  likeCount: number;
  // TODO: when replies for comments are implemented
  // replyCount
}

export const useCommentMetadata = (commentIds: number[]) => {
  return useQuery({
    queryKey: ['comment-metadata', commentIds],
    queryFn: async (): Promise<Record<number, CommentMetadata>> => {
      if (commentIds.length === 0) return {};

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Batch load all metadata in parallel
      const [likesData] = await Promise.all([
        // Get all likes for these posts
        supabase
          .from('comment_likes')
          .select('comment_id, user_id')
          .in('comment_id', commentIds),
      ]);

      // Process the data
      const metadata: Record<number, CommentMetadata> = {};

      commentIds.forEach(commentId => {
        const likes =
          likesData.data?.filter(like => like.comment_id === commentId) || [];

        metadata[commentId] = {
          commentId,
          isLiked: likes.some(like => like.user_id === user.id),
          likeCount: likes.length,
        };
      });

      return metadata;
    },
    enabled: commentIds.length > 0,
    staleTime: 1000 * 30, // 30 seconds
  });
};
