import { supabase } from '@/lib/supabase';

export interface SavePostResponse {
  success: boolean;
  saved: boolean;
}

export const savePost = async (postId: number): Promise<SavePostResponse> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Save the post
    await supabase.from('post_saves').insert({
      post_id: postId,
      user_id: user.id,
    });

    return {
      success: true,
      saved: true,
    };
  } catch (error) {
    console.error('Error saving post:', error);
    throw new Error('Failed to save post');
  }
};

export const unsavePost = async (postId: number): Promise<SavePostResponse> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Remove the save
    await supabase
      .from('post_saves')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    return {
      success: true,
      saved: false,
    };
  } catch (error) {
    console.error('Error unsaving post:', error);
    throw new Error('Failed to unsave post');
  }
};
