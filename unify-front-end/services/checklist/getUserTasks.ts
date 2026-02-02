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
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch user tasks: ${error.message}`);
    }

    return (data || []) as UserTaskRow[];
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    throw error;
  }
}
