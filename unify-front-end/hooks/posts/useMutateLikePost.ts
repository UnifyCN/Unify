import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likePost, unlikePost } from '@/services/posts/likePost';
import { updatePostAcrossCaches } from '@/utils/updatePostCaches';

export const useMutateLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      isLiked,
    }: {
      postId: number;
      isLiked: boolean;
    }) => {
      // Optimistically update UI immediately
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

      // Then make server request
      if (isLiked) {
        return await unlikePost(postId);
      } else {
        return await likePost(postId);
      }
    },
    onError: error => {
      console.error('Error liking/unliking post:', error);
    },
  });
};

// Usage in component:
// const likePostMutation = useLikePost();
//
// const handleLike = (postId: number, isLiked: boolean) => {
//   likePostMutation.mutate({ postId, isLiked });
// };
