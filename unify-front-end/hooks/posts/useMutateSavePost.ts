import { useMutation, useQueryClient } from '@tanstack/react-query';
import { savePost, unsavePost } from '@/services/posts/savePost';
import { updatePostAcrossCaches } from '@/utils/updatePostCaches';

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
      // Optimistically update UI immediately
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

      // Then make server request
      if (isSaved) {
        return await unsavePost(postId);
      } else {
        return await savePost(postId);
      }
    },
    onSuccess: () => {
      // Invalidate saved posts list for profile feed
      queryClient.invalidateQueries({
        queryKey: ['feed', 'savedPosts'],
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
