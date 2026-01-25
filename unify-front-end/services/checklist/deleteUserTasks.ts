import { supabase } from '@/lib/supabase';

export const deleteUserTasks = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_tasks')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete user tasks: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting user tasks:', error);
    throw error;
  }
};
