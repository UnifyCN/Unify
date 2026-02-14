import { supabase } from '@/lib/supabase';

export const deleteCustomUserTask = async (taskId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('custom_user_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('📋 deleteCustomUserTask - Delete error:', error);
      throw new Error(`Failed to delete custom task: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting custom user task:', error);
    throw error;
  }
};
