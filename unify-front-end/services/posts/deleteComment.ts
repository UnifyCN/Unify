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

    // Delete the comment (cascade will handle related records)
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
