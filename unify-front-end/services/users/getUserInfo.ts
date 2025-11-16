import { supabase } from '@/lib/supabase';

export interface UserInfo {
  id: string;
  username: string;
  createdAt: string;
  followingCount: number;
  followerCount: number;
  profilePictureUrl?: string;
  isPremium: boolean;
}

export const getUserInfo = async (userId?: string): Promise<UserInfo> => {
  try {
    let targetUserId = userId;

    // If no userId provided, get current user's ID
    if (!targetUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      targetUserId = user.id;
    }

    // Get user info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, created_at, profile_picture_url, is_premium')
      .eq('id', targetUserId)
      .single();

    if (userError) {
      throw new Error(`Failed to fetch user info: ${userError.message}`);
    }

    // Get following count
    const { count: followingCount, error: followingError } = await supabase
      .from('user_followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', targetUserId);

    if (followingError) {
      throw new Error(
        `Failed to fetch following count: ${followingError.message}`
      );
    }

    // Get follower count
    const { count: followerCount, error: followerError } = await supabase
      .from('user_followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', targetUserId);

    if (followerError) {
      throw new Error(
        `Failed to fetch follower count: ${followerError.message}`
      );
    }

    return {
      id: userData.id,
      username: userData.username,
      createdAt: userData.created_at,
      followingCount: followingCount || 0,
      followerCount: followerCount || 0,
      profilePictureUrl: userData.profile_picture_url,
      isPremium: userData.is_premium ?? false,
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
};
