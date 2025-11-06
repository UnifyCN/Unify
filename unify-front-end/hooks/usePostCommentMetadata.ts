import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface PostCommentMetadata {
  commentId: number;
  isLiked: boolean;
  likeCount: number;
  replyCount: number;
}

export const usePostCommentMetadata = (
  commentIds: number[],
  options?: { enabled: boolean }
) => {
  return useQuery({
    queryKey: ['comment-metadata', commentIds],
    queryFn: async (): Promise<Record<number, PostCommentMetadata>> => {
      if (commentIds.length === 0) return {};

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Batch load all metadata in parallel
      const [likesData, repliesData] = await Promise.all([
        supabase
          .from('comment_likes')
          .select('comment_id, user_id')
          .in('comment_id', commentIds),

        supabase
          .from('post_comments')
          .select('id, parent_comment_id')
          .in('parent_comment_id', commentIds),
      ]);

      if (likesData.error) throw likesData.error;
      if (repliesData.error) throw repliesData.error;

      // Build reply count map
      const replyCountMap: Record<number, number> = {};
      (repliesData.data || []).forEach(reply => {
        if (reply.parent_comment_id) {
          replyCountMap[reply.parent_comment_id] =
            (replyCountMap[reply.parent_comment_id] || 0) + 1;
        }
      });

      // Process the data
      const metadata: Record<number, PostCommentMetadata> = {};

      commentIds.forEach(commentId => {
        const likes =
          likesData.data?.filter(like => like.comment_id === commentId) || [];

        metadata[commentId] = {
          commentId,
          isLiked: likes.some(like => like.user_id === user.id),
          likeCount: likes.length,
          replyCount: replyCountMap[commentId] || 0,
        };
      });

      return metadata;
    },
    enabled: options?.enabled === true && commentIds.length > 0,
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Helper function to invalidate specific post metadata
export const useInvalidatePostCommentMetadata = () => {
  const queryClient = useQueryClient();

  const invalidatePostCommentMetadata = (commentId: number) => {
    // Find all queries that contain this postId
    queryClient.invalidateQueries({
      predicate: query => {
        const queryKey = query.queryKey;
        if (queryKey[0] === 'comment-metadata' && Array.isArray(queryKey[1])) {
          return queryKey[1].includes(commentId);
        }
        return false;
      },
    });
  };

  const updatePostCommentMetadata = (
    commentId: number,
    updates: Partial<PostCommentMetadata>
  ) => {
    // Update all queries that contain this commentId
    queryClient.setQueriesData(
      {
        predicate: query => {
          const queryKey = query.queryKey;
          if (
            queryKey[0] === 'comment-metadata' &&
            Array.isArray(queryKey[1])
          ) {
            return queryKey[1].includes(commentId);
          }
          return false;
        },
      },
      (oldData: Record<number, PostCommentMetadata> | undefined) => {
        if (!oldData || !oldData[commentId]) return oldData;

        return {
          ...oldData,
          [commentId]: {
            ...oldData[commentId],
            ...updates,
          },
        };
      }
    );
  };

  return { invalidatePostCommentMetadata, updatePostCommentMetadata };
};
