import { supabase } from '@/lib/supabase';
import { Priority } from '@/types/checklist';

export interface CustomUserTask {
  id: string;
  user_id: string;
  task_name: string;
  task_description: string | null;
  priority: Priority;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateCustomTaskParams {
  userId: string;
  taskName: string;
  taskDescription?: string;
  priority: Priority;
}

export const createCustomUserTask = async ({
  userId,
  taskName,
  taskDescription,
  priority,
}: CreateCustomTaskParams): Promise<CustomUserTask> => {
  try {
    const { data, error } = await supabase
      .from('custom_user_tasks')
      .insert({
        user_id: userId,
        task_name: taskName,
        task_description: taskDescription || null,
        priority,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('📋 createCustomUserTask - Insert error:', error);
      throw new Error(`Failed to create custom task: ${error.message}`);
    }

    return data as CustomUserTask;
  } catch (error) {
    console.error('Error creating custom user task:', error);
    throw error;
  }
};
