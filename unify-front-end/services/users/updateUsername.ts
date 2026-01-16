import { supabase } from '@/lib/supabase';

export const updateUsername = async (
  username: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate username format (alphanumeric with spaces, 1-20 characters)
    if (!/^[a-zA-Z0-9 ]{1,20}$/.test(username)) {
      throw new Error(
        'Username must be 1-20 characters and contain only letters, numbers, and spaces'
      );
    }

    const { error } = await supabase
      .from('users')
      .update({ username })
      .eq('id', user.id);

    if (error) {
      throw new Error(`Failed to update username: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating username:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed',
    };
  }
};
