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

    // Save the post. With the unique index on (user_id, post_id), a duplicate
    // is a 23505 — treat as idempotent success since the user's intent
    // (post is saved) is already satisfied.
    const { error: insertError } = await supabase.from('post_saves').insert({
      post_id: postId,
      user_id: user.id,
    });
    if (insertError && (insertError as { code?: string }).code !== '23505') {
      throw insertError;
    }

    return {
      success: true,
      saved: true,
    };
  } catch (error) {
    console.error('Error saving post:', error);
    throw new Error('Failed to save post', { cause: error });
  }
};

export const unsavePost = async (postId: number): Promise<SavePostResponse> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Remove the save
    const { error: deleteError } = await supabase
      .from('post_saves')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);
    if (deleteError) {
      throw deleteError;
    }

    return {
      success: true,
      saved: false,
    };
  } catch (error) {
    console.error('Error unsaving post:', error);
    throw new Error('Failed to unsave post', { cause: error });
  }
};
