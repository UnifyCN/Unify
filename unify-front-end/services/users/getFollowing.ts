import { supabase } from '@/lib/supabase';

export interface FollowingUser {
  id: string;
  username: string;
  profilePictureUrl?: string;
}

export const getFollowing = async (userId: string): Promise<FollowingUser[]> => {
  try {
    const { data, error } = await supabase
      .from('user_followers')
      .select(
        `
        following_id,
        profiles:following_id (
          id,
          username,
          profile_picture_url
        )
      `
      )
      .eq('follower_id', userId);

    if (error) {
      console.error('Error fetching following:', error);
      throw new Error(`Failed to fetch following: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // Transform the data to extract profile information
    const following: FollowingUser[] = data
      .map(item => {
        const profile = item.profiles as any;
        if (!profile) return null;
        return {
          id: profile.id,
          username: profile.username || 'Unknown User',
          profilePictureUrl: profile.profile_picture_url,
        };
      })
      .filter((user) => user !== null) as FollowingUser[];

    return following;
  } catch (error) {
    console.error('Error in getFollowing:', error);
    throw error;
  }
};
