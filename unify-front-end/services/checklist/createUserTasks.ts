import { supabase } from '@/lib/supabase';
import { PersonalizedChecklistTask } from '@/types/checklist';

export const createUserTasks = async (
  userId: string,
  tasks: PersonalizedChecklistTask[]
): Promise<void> => {
  try {
    const userTasks = tasks.map(task => ({
      user_id: userId,
      task_id: task.id,
      completed: false,
    }));

    const { data, error } = await supabase
      .from('user_tasks')
      .insert(userTasks)
      .select();

    if (error) {
      console.error('📋 createUserTasks - Insert error:', error);
      throw new Error(`Failed to create user tasks: ${error.message}`);
    }
  } catch (error) {
    console.error('Error creating user tasks:', error);
    throw error;
  }
};
