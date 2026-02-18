import { supabase } from '@/lib/supabase';

export interface FollowerUser {
  id: string;
  username: string;
  profilePictureUrl?: string;
}

export const getFollowers = async (userId: string): Promise<FollowerUser[]> => {
  try {
    const { data, error } = await supabase
      .from('user_followers')
      .select(
        `
        follower_id,
        profiles:follower_id (
          id,
          username,
          profile_picture_url
        )
      `
      )
      .eq('following_id', userId);

    if (error) {
      console.error('Error fetching followers:', error);
      throw new Error(`Failed to fetch followers: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // Transform the data to extract profile information
    const followers: FollowerUser[] = data
      .map(item => {
        const profile = item.profiles as any;
        if (!profile) return null;
        return {
          id: profile.id,
          username: profile.username || 'Unknown User',
          profilePictureUrl: profile.profile_picture_url,
        };
      })
      .filter(follower => follower !== null) as FollowerUser[];

    return followers;
  } catch (error) {
    console.error('Error in getFollowers:', error);
    throw error;
  }
};
