import { supabase } from '@/lib/supabase';

export const updateProfilePicture = async (
  profilePictureKey: string | null
): Promise<{ success: boolean; error?: string }> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('users')
      .update({ profile_picture_url: profilePictureKey })
      .eq('id', user.id);

    if (error) {
      throw new Error(`Failed to update profile picture: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating profile picture:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed',
    };
  }
};
