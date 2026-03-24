import { supabase } from '@/lib/supabase';
import { createCommentLikeNotification } from '@/services/notifications/createCommentLikeNotification';

export interface LikeCommentResponse {
  success: boolean;
  liked: boolean;
  likesCount: number;
}

export const likeComment = async (
  commentId: number
): Promise<LikeCommentResponse> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Like the comment (add the like)
    const { error: insertError } = await supabase.from('comment_likes').insert({
      comment_id: commentId,
      user_id: user.id,
    });

    if (insertError) {
      console.error('Error inserting comment like:', insertError);
      return { success: false, liked: false, likesCount: 0 };
    }

    // Get updated like count from post_comments table (trigger will have updated it)
    const { data: commentData, error: selectError } = await supabase
      .from('post_comments')
      .select('like_count')
      .eq('id', commentId)
      .single();

    if (selectError) {
      console.error('Error fetching comment like count:', selectError);
    }

    try {
      await createCommentLikeNotification(commentId);
    } catch (notifError) {
      console.error('Failed to create comment like notification:', notifError);
    }

    return {
      success: true,
      liked: true,
      likesCount: commentData?.like_count || 0,
    };
  } catch (error) {
    console.error('Error liking comment:', error);
    throw new Error('Failed to like comment');
  }
};

export const unlikeComment = async (
  commentId: number
): Promise<LikeCommentResponse> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Remove the like
    await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id);

    // Get updated like count from post_comments table (trigger will have updated it)
    const { data: commentData } = await supabase
      .from('post_comments')
      .select('like_count')
      .eq('id', commentId)
      .single();

    return {
      success: true,
      liked: false,
      likesCount: commentData?.like_count || 0,
    };
  } catch (error) {
    console.error('Error unliking comment:', error);
    throw new Error('Failed to unlike comment');
  }
};
