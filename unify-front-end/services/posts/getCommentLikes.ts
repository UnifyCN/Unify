import { supabase } from '@/lib/supabase';

export interface CommentLikeInfo {
  likeCount: number;
  userLiked: boolean;
}

export const getCommentLikes = async (commentId: number): Promise<CommentLikeInfo> => {
  try {
    // Get current commenter's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get like count from comments table
    const { data: commentData, error: postError } = await supabase
      .from('post_comments')
      .select('like_count')
      .eq('id', commentId)
      .single();

    if (postError) {
      throw new Error(`Failed to fetch post: ${postError}`);
    }

    // Check if user liked this specific comment
    const { data: userLike, error: likeError } = await supabase
      .from('comment_likes')
      .select('user_id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .maybeSingle();

    return {
      likeCount: commentData?.like_count || 0,
      userLiked: !!userLike,
    };
  } catch (error) {
    console.error('Error fetching comment likes:', error);
    throw error;
  }
};
