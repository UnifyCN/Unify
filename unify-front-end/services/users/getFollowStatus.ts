import { supabase, getAuthUserId } from '@/lib/supabase';

export const getFollowStatus = async (
  targetUserId: string
): Promise<boolean> => {
  try {
    const userId = await getAuthUserId();

    const { data, error } = await supabase
      .from('user_followers')
      .select('*')
      .eq('follower_id', userId)
      .eq('following_id', targetUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error
      throw new Error(`Failed to check follow status: ${error.message}`);
    }

    // If data exists, user is following; if not, user is not following
    return !!data;
  } catch (error) {
    console.error('Error checking follow status:', error);
    throw error;
  }
};
