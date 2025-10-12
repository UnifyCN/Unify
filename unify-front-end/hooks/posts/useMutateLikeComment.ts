import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likeComment, unlikeComment } from '@/services/posts/likeComment';

export const useMutateLikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      isLiked,
    }: {
      commentId: number;
      isLiked: boolean;
    }) => {
      if (isLiked) {
        return await unlikeComment(commentId);
      } else {
        return await likeComment(commentId);
      }
    },
    onSuccess: (_, { commentId }) => {
      // Invalidate the specific comment's likes query
      queryClient.invalidateQueries({
        queryKey: ['comment-likes', commentId],
      });
    },
    onError: error => {
      console.error('Error liking/unliking comment:', error);
    },
  });
};

// Usage in component:
// const likeCommentMutation = useLikeComment();
//
// const handleLike = (commentId: number, isLiked: boolean) => {
//   likeCommentMutation.mutate({ commentId, isLiked });
// };
