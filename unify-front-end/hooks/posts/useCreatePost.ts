import { CreatePost } from '@/services/posts/createPost';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useMutateCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      content,
      group_id,
    }: {
      title: string;
      content: string;
      group_id: string;
    }) => {
      await CreatePost(title, content, group_id);
    },
    onSuccess: () => {
      // for now just refetch all feeds, could be changed later
      queryClient.invalidateQueries({ queryKey: ['feed', 'groups'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'forYou'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'following'] });
    },
    onError: error => {
      console.error('Failed to create post:', error);
    },
  });
};

// Usage in component:
// const { mutate: createPostMutation, isPending } = useMutateCreatePost();
//
// const onSubmit = (title: string, content: string, group_id: string) => {
//   createPostMutation({ title, content, group_id });
// };
