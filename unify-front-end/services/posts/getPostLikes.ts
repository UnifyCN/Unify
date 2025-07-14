import { supabase } from "@/lib/supabase";

export interface PostLikeInfo {
  likeCount: number;
  userLiked: boolean;
}

export const getPostLikes = async (postId: number): Promise<PostLikeInfo> => {
  try {
    // Get current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get like count and check if user liked
    const { data, error } = await supabase
      .from('post_likes')
      .select('user_id')
      .eq('post_id', postId);

    if (error) {
      throw new Error(`Failed to fetch post likes: ${error.message}`);
    }

    const likeCount = data?.length || 0;
    const userLiked = data?.some(like => like.user_id === user.id) || false;

    return {
      likeCount,
      userLiked
    };
  } catch (error) {
    console.error('Error fetching post likes:', error);
    throw error;
  }
}; 