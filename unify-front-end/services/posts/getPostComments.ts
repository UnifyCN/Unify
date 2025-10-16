// services/comments/getPostComments.ts
import { supabase } from '@/lib/supabase';
import { PostCommentData } from '@/types/feeds/postcomment';

export const getPostComments = async (
  postId: number
): Promise<PostCommentData[]> => {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .select(
        `
            id,
            user_id,
            post_id,
            content,
            parent_comment_id,
            created_at,
            users!user_id(id, username, profile_picture_url),
            like_count
        `
      )
      .eq('post_id', Number(postId))
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((comment: any) => ({
      id: comment.id,
      user_id: comment.user_id,
      post_id: postId,
      content: comment.content,
      parent_comment_id: comment.parent_comment_id,
      created_at: comment.created_at,
      username: comment.users.username,
      profilePictureUrl: comment.users.profile_picture_url,
      like_count: comment.like_count,
    }));
  } catch (err) {
    console.error('Error fetching comments:', err);
    throw err;
  }
};
