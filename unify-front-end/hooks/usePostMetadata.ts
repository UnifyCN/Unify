import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPostMetadataBatch } from '@/services/posts/postMetadata';

interface PostMetadata {
  postId: number;
  isLiked: boolean;
  isSaved: boolean;
  likeCount: number;
  commentCount: number;
}

export const usePostMetadata = (postIds: number[]) => {
  const normalizedPostIds = Array.from(new Set(postIds)).sort((a, b) => a - b);

  return useQuery({
    queryKey: ['post-metadata', normalizedPostIds],
    queryFn: async (): Promise<Record<number, PostMetadata>> => {
      const metadataMap = await getPostMetadataBatch(normalizedPostIds);
      const metadata: Record<number, PostMetadata> = {};

      for (const [postIdKey, row] of Object.entries(metadataMap)) {
        const postId = Number(postIdKey);
        metadata[row.post_id] = {
          postId,
          isLiked: row.is_liked ?? false,
          isSaved: row.is_saved ?? false,
          likeCount: row.like_count ?? 0,
          commentCount: row.comment_count ?? 0,
        };
      }

      return metadata;
    },
    enabled: normalizedPostIds.length > 0,
    staleTime: 1000 * 30, // 30 seconds
    placeholderData: previousData => previousData,
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
