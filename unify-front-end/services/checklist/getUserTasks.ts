import { supabase } from '@/lib/supabase';

export interface UserTaskRow {
  user_task_id: number;
  user_id: string;
  task_id: number | null;
  sanity_checklist_id: string | null;
  completed: boolean;
  completed_at: string | null;
}

export async function getUserTasks(userId: string): Promise<UserTaskRow[]> {
  try {
    const { data, error } = await supabase
      .from('user_tasks')
      .select('user_task_id, user_id, task_id, sanity_checklist_id, completed, completed_at')
import { UserTaskWithDetails } from '@/types/checklist';

export const getUserTasks = async (
  userId: string
): Promise<UserTaskWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('user_tasks')
      .select(
        `
        user_task_id,
        user_id,
        task_id,
        completed,
        completed_at,
        task:personalized_checklist_tasks!user_tasks_task_id_fkey (
          id,
          persona,
          stage,
          priority,
          task_name,
          task_description,
          task_module
        )
      `
      )
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch user tasks: ${error.message}`);
    }

    return (data || []) as UserTaskRow[];
    // Transform the data to ensure task is a single object, not an array
    const transformedData = (data || []).map((item: any) => ({
      ...item,
      task: Array.isArray(item.task) ? item.task[0] : item.task,
    }));

    return transformedData as UserTaskWithDetails[];
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    throw error;
  }
}
};
