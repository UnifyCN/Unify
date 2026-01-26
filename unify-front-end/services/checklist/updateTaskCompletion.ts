import { supabase } from '@/lib/supabase';

export const updateTaskCompletion = async (
  userTaskId: number,
  completed: boolean
): Promise<void> => {
  try {
    const updateData: { completed: boolean; completed_at: string | null } = {  
      completed,  
      completed_at: completed ? new Date().toISOString() : null,  
    };  

    const { error } = await supabase
      .from('user_tasks')
      .update(updateData)
      .eq('user_task_id', userTaskId);

    if (error) {
      throw new Error(`Failed to update task completion: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating task completion:', error);
    throw error;
  }
};
