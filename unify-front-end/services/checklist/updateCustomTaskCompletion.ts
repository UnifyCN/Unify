import { supabase } from '@/lib/supabase';

export const updateCustomTaskCompletion = async (
  taskId: string,
  completed: boolean
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('custom_user_tasks')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', taskId);

    if (error) {
      console.error('📋 updateCustomTaskCompletion - Update error:', error);
      throw new Error(`Failed to update task completion: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating custom task completion:', error);
    throw error;
  }
};
