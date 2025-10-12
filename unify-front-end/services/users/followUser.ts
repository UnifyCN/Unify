import { supabase } from '@/lib/supabase';

export interface FollowAction {
  targetUserId: string;
  isFollowing: boolean;
}

export const followUser = async ({
  targetUserId,
  isFollowing,
}: FollowAction): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (isFollowing) {
      // Follow the user
      const { error } = await supabase.from('user_followers').insert({
        follower_id: user.id,
        following_id: targetUserId,
      });

      if (error) {
        throw new Error(`Failed to follow user: ${error.message}`);
      }
    } else {
      // Unfollow the user
      const { error } = await supabase
        .from('user_followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) {
        throw new Error(`Failed to unfollow user: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error following/unfollowing user:', error);
    throw error;
  }
};
