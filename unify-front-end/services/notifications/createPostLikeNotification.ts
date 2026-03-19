import { supabase } from '@/lib/supabase';

/**
 * Create a "someone liked your post" notification for the post author.
 * Call after likePost() succeeds. No-op if the post author is the current user.
 */
export const createPostLikeNotification = async (
  postId: number
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

  const { error } = await supabase.from('community_notifications').insert({
    user_id: post.user_id,
    triggered_by_user_id: user.id,
    type: 'liked',
    title: 'New like on your post',
    body: `${username} liked your post.`,
    data: { post_id: postId, actor_user_id: user.id },
  });

  if (error) {
    console.error('Failed to create post-like notification', {
      postId,
      postOwnerId: post.user_id,
      actorUserId: user.id,
      actorUsername: username,
      error,
    });
  }
};
