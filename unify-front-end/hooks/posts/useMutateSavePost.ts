import { useMutation, useQueryClient } from '@tanstack/react-query';
import { savePost, unsavePost } from '@/services/posts/savePost';
import {
  getSnapshotsForPost,
  PostCacheSnapshot,
  shouldUpdateFeedCache,
  updatePostAcrossCaches,
} from '@/utils/updatePostCaches';

interface SavePostContext {
  snapshots: PostCacheSnapshot[];
}

export const useMutateSavePost = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { postId: number; isSaved: boolean }, SavePostContext>({
    mutationFn: async ({ postId, isSaved }) => {
      if (isSaved) {
        return await unsavePost(postId);
      } else {
        return await savePost(postId);
      }
    },
    onMutate: async ({ postId, isSaved }) => {
      await queryClient.cancelQueries({
        predicate: query =>
          Array.isArray(query.queryKey) &&
          (query.queryKey[0] === 'post-metadata' ||
            shouldUpdateFeedCache(query.queryKey) ||
            (query.queryKey[0] === 'post' && query.queryKey[1] === postId)),
      });

      const snapshots = getSnapshotsForPost(queryClient, postId);

      queryClient.setQueriesData(
        { queryKey: ['post-metadata'] },
        (oldData: Record<number, any> | undefined) => {
          if (!oldData) return oldData;

          const updatedData = { ...oldData };
          if (updatedData[postId]) {
            updatedData[postId] = {
              ...updatedData[postId],
              isSaved: !isSaved,
            };
          }
          return updatedData;
        }
      );

      updatePostAcrossCaches(queryClient, postId, post => ({
        ...post,
        isSaved: !isSaved,
      }));

      return { snapshots };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['post-metadata'],
      });
    },
    onError: (error, _variables, context) => {
      context?.snapshots.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey, data);
      });

      queryClient.invalidateQueries({
        queryKey: ['post-metadata'],
      });

      console.error('Error saving/unsaving post:', error);
    },
    onSettled: (_data, _error, variables) => {
      // Invalidate saved posts list for profile feed
      queryClient.invalidateQueries({
        queryKey: ['feed', 'savedPosts'],
      });

      queryClient.invalidateQueries({
        queryKey: ['post', variables.postId],
      });
    },
  });
};

// Usage in component:
// const savePostMutation = useSavePost();
//
// const handleSave = (postId: number, isSaved: boolean) => {
//   savePostMutation.mutate({ postId, isSaved });
// };
