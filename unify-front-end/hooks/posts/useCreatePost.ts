import { CreatePost } from '@/services/posts/createPost';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useMutateCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      content,
      post_image_urls,
      group_id,
    }: {
      title: string;
      content: string;
      post_image_urls?: string[];
      group_id?: string | null;
    }) => {
      await CreatePost(title, content, post_image_urls ?? [], group_id);
    },
    onSuccess: () => {
      // Reset feeds to immediately show new post
      queryClient.resetQueries({ queryKey: ['feed', 'groups'] });
      queryClient.resetQueries({ queryKey: ['feed', 'forYou'] });
      queryClient.resetQueries({ queryKey: ['feed', 'following'] });
      queryClient.resetQueries({ queryKey: ['group', 'posts'] });
    },
    onError: error => {
      console.error('Failed to create post:', error);
    },
  });
};

// Usage in component:
// const { mutate: createPostMutation, isPending } = useMutateCreatePost();
//
// const onSubmit = (title: string, content: string, post_image_urls: string[], group_id: string) => {
//   createPostMutation({ title, content, post_image_urls, group_id });
// };
