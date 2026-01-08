import { supabase } from '@/lib/supabase';

export interface DeleteCommentResponse {
  success: boolean;
}

export const deleteComment = async (
  commentId: number
): Promise<DeleteCommentResponse> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get user permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('permissions')
      .eq('id', user.id)
      .single();

    if (userError) {
      throw new Error(`Failed to verify user permissions: ${userError.message}`);
    }

    const isAdmin = userData?.permissions === 'admin';
    const isPartner = userData?.permissions === 'partner';

    // Get comment data to check ownership
    const { data: commentData, error: commentError } = await supabase
      .from('post_comments')
      .select('user_id, post_id')
      .eq('id', commentId)
      .single();

    if (commentError) {
      throw new Error(`Failed to fetch comment: ${commentError.message}`);
    }

    const ownsComment = commentData?.user_id === user.id;

    // Admins can delete any comment
    if (isAdmin) {
      // Proceed to delete
    } else if (isPartner) {
      // Partners can delete their own comments OR comments on posts they own
      const { data: postData } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', commentData.post_id)
        .single();

      const ownsPost = postData?.user_id === user.id;

      if (!ownsComment && !ownsPost) {
        throw new Error('Partners can only delete their own comments or comments on their posts');
      }
    } else {
      // Regular users cannot delete comments
      throw new Error('You do not have permission to delete comments');
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      throw new Error(`Failed to delete comment: ${deleteError.message}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};
