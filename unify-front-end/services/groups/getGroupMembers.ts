import { supabase } from '@/lib/supabase';

export type GroupMember = {
  id: string;
  username: string;
  profilePictureUrl: string | null;
  isFollowing: boolean;
  followsYou: boolean;
  isMutual: boolean;
};

export const getGroupMembers = async (groupId: number): Promise<GroupMember[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const currentUserId = user.id;

  // 1. Get group members + users
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      user_id,
      users:user_id (
        id,
        username,
        profile_picture_url
      )
    `)
    .eq('group_id', groupId);

  if (error) throw error;

  const members = data
    ?.map((row: any) => ({
      id: row.users?.id,
      username: row.users?.username ?? 'Unknown',
      profilePictureUrl: row.users?.profile_picture_url ?? null,
    }))
    .filter(m => m.id !== currentUserId) ?? [];

  if (members.length === 0) return [];

  const memberIds = members.map(m => m.id);

  // 2. Get follow relationships
  const { data: follows } = await supabase
    .from('user_followers')
    .select('follower_id, following_id')
    .or(
      [
        `and(follower_id.eq.${currentUserId},following_id.in.(${memberIds.join(',')}))`,
        `and(following_id.eq.${currentUserId},follower_id.in.(${memberIds.join(',')}))`,
      ].join(',')
    );

  const followingSet = new Set(
    (follows ?? [])
      .filter(f => f.follower_id === currentUserId)
      .map(f => f.following_id)
  );

  const followersSet = new Set(
    (follows ?? [])
      .filter(f => f.following_id === currentUserId)
      .map(f => f.follower_id)
  );

  return members.map(m => {
    const isFollowing = followingSet.has(m.id);
    const followsYou = followersSet.has(m.id);

    return {
      ...m,
      isFollowing,
      followsYou,
      isMutual: isFollowing || followsYou,
    };
  });
};