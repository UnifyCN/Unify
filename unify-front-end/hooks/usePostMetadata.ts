import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface PostMetadata {
  postId: number;
  isLiked: boolean;
  isSaved: boolean;
  likeCount: number;
  commentCount: number;
}

export const usePostMetadata = (postIds: number[]) => {
  return useQuery({
    queryKey: ['post-metadata', postIds],
    queryFn: async (): Promise<Record<number, PostMetadata>> => {
      if (postIds.length === 0) return {};

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Batch load all metadata in parallel
      const [likesData, commentsData, savesData] = await Promise.all([
        // Get all likes for these posts
        supabase
          .from('post_likes')
          .select('post_id, user_id')
          .in('post_id', postIds),

        // Get comment count for these posts
        supabase.from('post_comments').select('post_id').in('post_id', postIds),

        // Get all saves for these posts
        supabase
          .from('post_saves')
          .select('post_id, user_id')
          .in('post_id', postIds),
      ]);

      // Process the data
      const metadata: Record<number, PostMetadata> = {};

      postIds.forEach(postId => {
        const likes =
          likesData.data?.filter(like => like.post_id === postId) || [];

        const comments =
          commentsData.data?.filter(comment => comment.post_id === postId) ||
          [];

        const saves =
          savesData.data?.filter(save => save.post_id === postId) || [];

        metadata[postId] = {
          postId,
          isLiked: likes.some(like => like.user_id === user.id),
          isSaved: saves.some(save => save.user_id === user.id),
          likeCount: likes.length,
          commentCount: comments.length,
        };
      });

      return metadata;
    },
    enabled: postIds.length > 0,
    staleTime: 1000 * 30, // 30 seconds
  });
};
