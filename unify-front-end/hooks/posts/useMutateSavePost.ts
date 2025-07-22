import { useMutation, useQueryClient } from '@tanstack/react-query';
import { savePost, unsavePost } from '@/services/posts/savePost';

export const useMutateSavePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      isSaved,
    }: {
      postId: number;
      isSaved: boolean;
    }) => {
      if (isSaved) {
        return await unsavePost(postId);
      } else {
        return await savePost(postId);
      }
    },
    onSuccess: (_, { postId }) => {
      // Invalidate the specific post's save status
      queryClient.invalidateQueries({
        queryKey: ['post-save-status', postId],
      });

      // Invalidate the saved posts list
      queryClient.invalidateQueries({
        queryKey: ['saved-posts'],
      });
    },
    onError: error => {
      console.error('Error saving/unsaving post:', error);
    },
  });
};

// Usage in component:
// const savePostMutation = useSavePost();
//
// const handleSave = (postId: number, isSaved: boolean) => {
//   savePostMutation.mutate({ postId, isSaved });
// };
