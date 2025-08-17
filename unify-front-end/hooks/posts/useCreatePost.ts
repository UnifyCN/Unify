import { CreatePost } from "@/services/posts/createPost";
import { useMutation, useQueryClient } from "@tanstack/react-query"

export const useMutateCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      await CreatePost(content);
    },
    onSuccess: () => {
      // for now just refetch all feeds, could be changed later
      queryClient.invalidateQueries({ queryKey: ['feed', 'groups'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'forYou'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'following'] });
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
    }
  });
};

// Usage in component:
// const { mutate: createPostMutation, isPending } = useLikePost();
//
// const onSubmit = (text: string) => {
//   createPostMutation(text);
// };
