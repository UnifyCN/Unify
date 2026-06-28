import { supabase } from '@/lib/supabase';

/**
 * Notify the discussion author when someone replies to their question.
 * No-op if the discussion author is the current user.
 */
export const createDiscussionReplyNotification = async (
  discussionId: string,
  replyId: string
): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: discussion } = await supabase
    .from('module_discussions')
    .select('author_id, module_id')
    .eq('id', discussionId)
    .single();

  if (!discussion || discussion.author_id === user.id) return;

  const { data: actor } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single();

  const username = actor?.username ?? 'Someone';

  const { data: inserted, error } = await supabase
    .from('community_notifications')
    .insert({
      user_id: discussion.author_id,
      triggered_by_user_id: user.id,
      type: 'discussion_reply',
      title: 'Reply to your question',
      body: `${username} replied to your discussion.`,
      data: {
        discussion_id: discussionId,
        reply_id: replyId,
        module_id: discussion.module_id,
        actor_user_id: user.id,
      },
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create discussion-reply notification', {
      discussionId,
      replyId,
      discussionOwnerId: discussion.author_id,
      actorUserId: user.id,
      error,
    });
    return;
  }

  if (inserted?.id) {
    const { error: pushError } = await supabase.functions.invoke(
      'send-social-push',
      { body: { notification_id: inserted.id } }
    );
    if (pushError) {
      console.error('send-social-push failed (discussion_reply)', pushError);
    }
  }
};
