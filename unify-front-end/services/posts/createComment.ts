import { supabase } from '@/lib/supabase';
import { createCommentNotification } from '@/services/notifications/createCommentNotification';
import { createCommentReplyNotification } from '@/services/notifications/createCommentReplyNotification';

export const createComment = async (
  postId: number,
  content: string,
  parentCommentId?: number | null
) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('User not authenticated', authError);
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('post_comments')
    .insert([
      {
        post_id: postId,
        user_id: user.id,
        content,
        parent_comment_id: parentCommentId || null,
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error('Error inserting comment:', error);
    throw new Error(error.message);
  }

  if (data) {
    createCommentNotification(postId, data.id).catch(() => {});
    if (parentCommentId) {
      createCommentReplyNotification(postId, data.id, parentCommentId).catch(() => {});
    }
  }

  return data;
};
