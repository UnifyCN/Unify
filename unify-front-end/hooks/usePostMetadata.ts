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
      const [likesData, savesData] = await Promise.all([
        // Get all likes for these posts
        supabase
          .from('post_likes')
          .select('post_id, user_id')
          .in('post_id', postIds),

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
        const saves =
          savesData.data?.filter(save => save.post_id === postId) || [];

        metadata[postId] = {
          postId,
          isLiked: likes.some(like => like.user_id === user.id),
          isSaved: saves.some(save => save.user_id === user.id),
          likeCount: likes.length,
          commentCount: 0, // TODO: Return 0 for now, no SQL query
        };
      });

      return metadata;
    },
    enabled: postIds.length > 0,
    staleTime: 1000 * 30, // 30 seconds
  });
};
