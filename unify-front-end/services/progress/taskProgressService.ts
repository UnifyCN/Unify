import { progressClient } from './progressClient';
import { UserTaskProgress } from '@/types/progress';
import { progressEventEmitter } from '@/utils/progressEventEmitter';

const TABLE = 'user_task_progress';

export async function getTaskProgress(
  taskId: string
): Promise<UserTaskProgress | null> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return null;

    const { data, error } = await progressClient
      .from(TABLE)
      .select('*')
      .eq('user_id', user.id)
      .eq('sanity_task_id', taskId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching task progress:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getTaskProgress:', error);
    return null;
  }
}

/** Get all task progress for a submodule (for progress % on submodule index) */
export async function getTaskProgressBySubmodule(
  submoduleId: string
): Promise<UserTaskProgress[]> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return [];

    const { data, error } = await progressClient
      .from(TABLE)
      .select('*')
      .eq('user_id', user.id)
      .eq('sanity_submodule_id', submoduleId);

    if (error) {
      console.error('Error fetching task progress by submodule:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error in getTaskProgressBySubmodule:', error);
    return [];
  }
}

export async function startTask(
  taskId: string,
  submoduleId: string,
  moduleId: string
): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient.from(TABLE).upsert(
      {
        user_id: user.id,
        sanity_task_id: taskId,
        sanity_submodule_id: submoduleId,
        sanity_module_id: moduleId,
        is_in_progress: true,
        is_completed: false,
        last_accessed_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,sanity_task_id',
      }
    );

    if (error) {
      console.error('Error starting task:', error);
    } else {
      progressEventEmitter.emit();
    }
  } catch (error) {
    console.error('Error in startTask:', error);
  }
}

export async function completeTask(taskId: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient
      .from(TABLE)
      .update({
        is_completed: true,
        is_in_progress: false,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('sanity_task_id', taskId);

    if (error) {
      console.error('Error completing task:', error);
    } else {
      progressEventEmitter.emit();
    }
  } catch (error) {
    console.error('Error in completeTask:', error);
  }
}

export async function updateTaskLastAccessed(taskId: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient
      .from(TABLE)
      .update({
        last_accessed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('sanity_task_id', taskId);

    if (error) {
      console.error('Error updating task last accessed:', error);
    } else {
      progressEventEmitter.emit();
    }
  } catch (error) {
    console.error('Error in updateTaskLastAccessed:', error);
  }
}
