import { supabase } from '@/lib/supabase';

/**
 * Create a "someone followed you" notification for the user who was followed.
 * Call after followUser() succeeds (when isFollowing is true).
 */
export const createFollowNotification = async (
  followingId: string
): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (user.id === followingId) return;

  const { data: actor } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single();

  const username = actor?.username ?? 'Someone';

  await supabase.from('community_notifications').insert({
    user_id: followingId,
    type: 'followed',
    title: 'New follower',
    body: `${username} started following you.`,
    data: { actor_user_id: user.id },
  });
};
