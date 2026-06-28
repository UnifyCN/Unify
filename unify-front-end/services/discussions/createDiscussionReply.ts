import { supabase } from '@/lib/supabase';
import { createDiscussionReplyNotification } from '@/services/notifications/createDiscussionReplyNotification';

export const createDiscussionReply = async (
  discussionId: string,
  body: string
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
    .from('discussion_replies')
    .insert({
      discussion_id: discussionId,
      author_id: user.id,
      body: body.trim(),
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating discussion reply:', error);
    throw new Error(error.message);
  }

  if (data) {
    createDiscussionReplyNotification(discussionId, data.id).catch(err =>
      console.error('[Notification] discussion reply failed:', err)
    );
  }

  return data;
};
