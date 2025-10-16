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
      // Optimistically update UI immediately
      queryClient.setQueriesData(
        { queryKey: ['comment-metadata'] },
        (oldData: Record<number, any> | undefined) => {
          if (!oldData) return oldData;

          const updatedData = { ...oldData };
          if (updatedData[commentId]) {
            updatedData[commentId] = {
              ...updatedData[commentId],
              isLiked: !isLiked,
              likeCount: updatedData[commentId].likeCount + (isLiked ? -1 : 1),
            };
          }
          return updatedData;
        }
      );

      // Then make server request
      if (isLiked) {
        return await unlikeComment(commentId);
      } else {
        return await likeComment(commentId);
      }
    },
    onError: err => {
      console.error('Error liking/unliking comment:', err);
    },
  });
};

// Usage in component:
// const likeCommentMutation = useLikeComment();
//
// const handleLike = (commentId: number, isLiked: boolean) => {
//   likeCommentMutation.mutate({ commentId, isLiked });
// };
