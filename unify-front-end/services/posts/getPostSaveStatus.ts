import { supabase } from '@/lib/supabase';

export interface PostSaveInfo {
  saved: boolean;
}

export const getPostSaveStatus = async (
  postId: number
): Promise<PostSaveInfo> => {
  try {
    // Get current user's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user saved this specific post
    const { data: userSave, error } = await supabase
      .from('post_saves')
      .select('user_id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check post save status: ${error.message}`);
    }

    return {
      saved: !!userSave,
    };
  } catch (error) {
    console.error('Error fetching post save status:', error);
    throw error;
  }
};
