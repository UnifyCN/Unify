import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportPost, unreportPost } from '@/services/posts/reportPost';

export const useMutateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      isReported,
      reason,
    }: {
      postId: number;
      isReported: boolean;
      reason: string;
    }) => {
      queryClient.setQueriesData(
        { queryKey: ['post-metadata'] },
        (oldData: Record<number, any> | undefined) => {
          if (!oldData) return oldData;

          const updatedData = { ...oldData };
          if (updatedData[postId]) {
            updatedData[postId] = {
              ...updatedData[postId],
              isReported: !isReported,
              reportCount: updatedData[postId].reportCount + (isReported ? -1 : 1),
            };
          }
          return updatedData;
        }
      );

      // Then make server request
      if (isReported) {
        return await unreportPost(postId);
      } else {
        return await reportPost(postId, reason);
      }
    },
    onError: error => {
      console.error('Error liking/unliking post:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-metadata'] });
    },
  });
};

// Usage in component:
// const likePostMutation = useLikePost();
//
// const handleLike = (postId: number, isLiked: boolean) => {
//   likePostMutation.mutate({ postId, isLiked });
// };
