import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likePost, unlikePost } from '@/services/posts/likePost';

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: number; isLiked: boolean }) => {
      if (isLiked) {
        return await unlikePost(postId);
      } else {
        return await likePost(postId);
      }
    },
    onSuccess: (data, { postId }) => {
      // Invalidate the specific post's like data
      queryClient.invalidateQueries({
        queryKey: ['post-likes', postId]
      });
      
      console.log('Like post mutation successful:', data);
      console.log('Post ID:', postId);
    },
  });
};

// Usage in component:
// const likePostMutation = useLikePost();
// 
// const handleLike = (postId: number, isLiked: boolean) => {
//   likePostMutation.mutate({ postId, isLiked });
// }; 