import { supabase } from '@/lib/supabase';

export const CreatePost = async (
  title: string,
  content: string,
  post_image_urls: string[],
  group_id?: string | null
) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: title,
        content: content,
        post_image_urls: post_image_urls ?? [],
        user_id: user.id,
        group_id: group_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating post:', error);
    throw new Error('Failed to create post');
  }
};
