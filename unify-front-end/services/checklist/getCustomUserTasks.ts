import { supabase } from '@/lib/supabase';
import { CustomUserTask } from './createCustomUserTask';

export const getCustomUserTasks = async (
  userId: string
): Promise<CustomUserTask[]> => {
  try {
    const { data, error } = await supabase
      .from('custom_user_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('📋 getCustomUserTasks - Query error:', error);
      throw new Error(`Failed to fetch custom tasks: ${error.message}`);
    }

    return (data || []) as CustomUserTask[];
  } catch (error) {
    console.error('Error fetching custom user tasks:', error);
    throw error;
  }
};
