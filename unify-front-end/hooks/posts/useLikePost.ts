import { useMutation } from '@tanstack/react-query';
import { likePost, unlikePost } from '@/services/posts/likePost';

export const useLikePost = () => {
  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: number; isLiked: boolean }) => {
      if (isLiked) {
        return await unlikePost(postId);
      } else {
        return await likePost(postId);
      }
    },
    onSuccess: (data, { postId, isLiked }) => {
      // TODO: Update the specific post in all feed queries
      console.log('Like post mutation successful:', data);
      console.log('Post ID:', postId);
      console.log('Is liked:', isLiked);
    },
  });
};

// Usage in component:
// const likePostMutation = useLikePost();
// 
// const handleLike = (postId: number, isLiked: boolean) => {
//   likePostMutation.mutate({ postId, isLiked });
// }; 