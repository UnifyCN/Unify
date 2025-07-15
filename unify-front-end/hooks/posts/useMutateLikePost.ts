import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likePost, unlikePost } from '@/services/posts/likePost';

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
      if (isLiked) {
        return await unlikePost(postId);
      } else {
        return await likePost(postId);
      }
    },
    onSuccess: (_, { postId }) => {
      // Invalidate the specific post's likes query
      queryClient.invalidateQueries({
        queryKey: ['post-likes', postId],
      });
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
