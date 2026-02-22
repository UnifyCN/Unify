import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, getAuthUserId } from '@/lib/supabase';

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

      const userId = await getAuthUserId();

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
      const postIdSet = new Set(postIds);

      postIds.forEach(postId => {
        metadata[postId] = {
          postId,
          isLiked: false,
          isSaved: false,
          likeCount: 0,
          commentCount: 0,
        };
      });

      for (const like of likesData.data || []) {
        if (!postIdSet.has(like.post_id)) continue;
        metadata[like.post_id].likeCount += 1;
        if (like.user_id === userId) {
          metadata[like.post_id].isLiked = true;
        }
      }

      for (const comment of commentsData.data || []) {
        if (!postIdSet.has(comment.post_id)) continue;
        metadata[comment.post_id].commentCount += 1;
      }

      for (const save of savesData.data || []) {
        if (!postIdSet.has(save.post_id)) continue;
        if (save.user_id === userId) {
          metadata[save.post_id].isSaved = true;
        }
      }

      return metadata;
    },
    enabled: postIds.length > 0,
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Helper function to invalidate specific post metadata
export const useInvalidatePostMetadata = () => {
  const queryClient = useQueryClient();

  const invalidatePostMetadata = (postId: number) => {
    // Find all queries that contain this postId
    queryClient.invalidateQueries({
      predicate: query => {
        const queryKey = query.queryKey;
        if (queryKey[0] === 'post-metadata' && Array.isArray(queryKey[1])) {
          return queryKey[1].includes(postId);
        }
        return false;
      },
    });
  };

  const updatePostMetadata = (
    postId: number,
    updates: Partial<PostMetadata>
  ) => {
    // Update all queries that contain this postId
    queryClient.setQueriesData(
      {
        predicate: query => {
          const queryKey = query.queryKey;
          if (queryKey[0] === 'post-metadata' && Array.isArray(queryKey[1])) {
            return queryKey[1].includes(postId);
          }
          return false;
        },
      },
      (oldData: Record<number, PostMetadata> | undefined) => {
        if (!oldData || !oldData[postId]) return oldData;

        return {
          ...oldData,
          [postId]: {
            ...oldData[postId],
            ...updates,
          },
        };
      }
    );
  };

  return { invalidatePostMetadata, updatePostMetadata };
};
