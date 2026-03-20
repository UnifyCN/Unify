import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likePost, unlikePost } from '@/services/posts/likePost';
import { updatePostAcrossCaches } from '@/utils/updatePostCaches';

interface PostCacheSnapshot {
  queryKey: readonly unknown[];
  data: unknown;
}

interface LikePostContext {
  snapshots: PostCacheSnapshot[];
}

const getSnapshotsForPost = (
  queryClient: ReturnType<typeof useQueryClient>,
  postId: number
): PostCacheSnapshot[] => [
  ...queryClient
    .getQueriesData({
      queryKey: ['post-metadata'],
    })
    .map(([queryKey, data]) => ({ queryKey, data })),
  ...queryClient
    .getQueriesData({
      predicate: query =>
        Array.isArray(query.queryKey) &&
        (query.queryKey[0] === 'feed' ||
          query.queryKey[0] === 'userPosts' ||
          (query.queryKey[0] === 'group' && query.queryKey[1] === 'posts') ||
          query.queryKey[0] === 'searchPosts' ||
          query.queryKey[0] === 'morePosts' ||
          (query.queryKey[0] === 'post' && query.queryKey[1] === postId)),
    })
    .map(([queryKey, data]) => ({ queryKey, data })),
];

export const useMutateLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { postId: number; isLiked: boolean }, LikePostContext>({
    mutationFn: async ({ postId, isLiked }) => {
      if (isLiked) {
        return await unlikePost(postId);
      } else {
        return await likePost(postId);
      }
    },
    onMutate: async ({ postId, isLiked }) => {
      const snapshots = getSnapshotsForPost(queryClient, postId);

      queryClient.setQueriesData(
        { queryKey: ['post-metadata'] },
        (oldData: Record<number, any> | undefined) => {
          if (!oldData) return oldData;

          const updatedData = { ...oldData };
          if (updatedData[postId]) {
            updatedData[postId] = {
              ...updatedData[postId],
              isLiked: !isLiked,
              likeCount: updatedData[postId].likeCount + (isLiked ? -1 : 1),
            };
          }
          return updatedData;
        }
      );

      updatePostAcrossCaches(queryClient, postId, post => ({
        ...post,
        isLiked: !isLiked,
        likeCount: (post.likeCount ?? 0) + (isLiked ? -1 : 1),
      }));

      return { snapshots };
    },
    onError: (error, _variables, context) => {
      context?.snapshots.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey, data);
      });

      queryClient.invalidateQueries({
        queryKey: ['post-metadata'],
      });

      console.error('Error liking/unliking post:', error);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['post', variables.postId],
      });
    },
  });
};

// Usage in component:
// const likePostMutation = useLikePost();
//
// const handleLike = (postId: number, isLiked: boolean) => {
//   likePostMutation.mutate({ postId, isLiked });
// };
