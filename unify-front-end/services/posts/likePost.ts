import { supabase } from '@/lib/supabase';
import { createPostLikeNotification } from '@/services/notifications/createPostLikeNotification';

export interface LikePostResponse {
  success: boolean;
  liked: boolean;
  likesCount: number;
}

export const likePost = async (postId: number): Promise<LikePostResponse> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Like the post (add the like)
    await supabase.from('post_likes').insert({
      post_id: postId,
      user_id: user.id,
    });

    // Notify post author (fire-and-forget)
    createPostLikeNotification(postId).catch(() => {});

    // Get updated like count from posts table (trigger will have updated it)
    const { data: postData } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', postId)
      .single();

    return {
      success: true,
      liked: true,
      likesCount: postData?.like_count || 0,
    };
  } catch (error) {
    console.error('Error liking post:', error);
    throw new Error('Failed to like post');
  }
};

export const unlikePost = async (postId: number): Promise<LikePostResponse> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Remove the like
    await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    // Get updated like count from posts table (trigger will have updated it)
    const { data: postData } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', postId)
      .single();

    return {
      success: true,
      liked: false,
      likesCount: postData?.like_count || 0,
    };
  } catch (error) {
    console.error('Error unliking post:', error);
    throw new Error('Failed to unlike post');
  }
};
