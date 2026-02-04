import { supabase } from '@/lib/supabase';

/**
 * Create a "someone commented on your post" notification for the post author.
 * Call after createComment() succeeds. No-op if the post author is the current user.
 */
export const createCommentNotification = async (
  postId: number,
  commentId: number
): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  if (!post || post.user_id === user.id) return;

  const { data: actor } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single();

  const username = actor?.username ?? 'Someone';

  await supabase.from('community_notifications').insert({
    user_id: post.user_id,
    type: 'commented',
    title: 'New comment on your post',
    body: `${username} commented on your post.`,
    data: { post_id: postId, comment_id: commentId, actor_user_id: user.id },
  });
};
