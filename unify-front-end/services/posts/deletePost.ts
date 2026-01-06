import { supabase } from '@/lib/supabase';

export interface DeletePostResponse {
  success: boolean;
}

export const deletePost = async (
  postId: number
): Promise<DeletePostResponse> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user is admin or partner
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('permissions')
      .eq('id', user.id)
      .single();

    if (userError) {
      throw new Error(
        `Failed to verify user permissions: ${userError.message}`
      );
    }

    const isAdmin = userData?.permissions === 'admin';
    const isPartner = userData?.permissions === 'partner';

    // If not admin or partner, deny access
    // Ownership checks are handled in the frontend
    if (!isAdmin && !isPartner) {
      throw new Error('Only admin and partner users can delete posts');
    }

    // Delete the post (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      throw new Error(`Failed to delete post: ${deleteError.message}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};
