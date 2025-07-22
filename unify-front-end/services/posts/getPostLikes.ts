import { supabase } from '@/lib/supabase';

export interface PostLikeInfo {
  likeCount: number;
  userLiked: boolean;
}

export const getPostLikes = async (postId: number): Promise<PostLikeInfo> => {
  try {
    // Get current user's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get like count from posts table
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', postId)
      .single();

    if (postError) {
      throw new Error(`Failed to fetch post: ${postError}`);
    }

    // Check if user liked this specific post
    const { data: userLike, error: likeError } = await supabase
      .from('post_likes')
      .select('user_id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    return {
      likeCount: postData?.like_count || 0,
      userLiked: !!userLike,
    };
  } catch (error) {
    console.error('Error fetching post likes:', error);
    throw error;
  }
};
