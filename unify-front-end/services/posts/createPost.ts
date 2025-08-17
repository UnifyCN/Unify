import { supabase } from "@/lib/supabase";

export const CreatePost = async (content: string) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        content: content,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating post:', error);
    throw new Error('Failed to create post');
  }
}