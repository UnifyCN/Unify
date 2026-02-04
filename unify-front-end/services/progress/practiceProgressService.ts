import { progressClient } from './progressClient';
import { UserPracticeProgress } from '@/types/progress';
import { progressEventEmitter } from '@/utils/progressEventEmitter';

const TABLE = 'user_practice_progress';

export async function getPracticeProgress(
  practiceId: string
): Promise<UserPracticeProgress | null> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return null;

    const { data, error } = await progressClient
      .from(TABLE)
      .select('*')
      .eq('user_id', user.id)
      .eq('sanity_practice_id', practiceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching practice progress:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getPracticeProgress:', error);
    return null;
  }
}

/** Get all practice progress for a submodule (for progress % on submodule index) */
export async function getPracticeProgressBySubmodule(
  submoduleId: string
): Promise<UserPracticeProgress[]> {
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
      console.error('Error fetching practice progress by submodule:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error in getPracticeProgressBySubmodule:', error);
    return [];
  }
}

export async function startPractice(
  practiceId: string,
  submoduleId: string,
  moduleId: string,
  practiceType: 'quiz' | 'activity'
): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient.from(TABLE).upsert(
      {
        user_id: user.id,
        sanity_practice_id: practiceId,
        sanity_submodule_id: submoduleId,
        sanity_module_id: moduleId,
        practice_type: practiceType,
        current_page_number: 1,
        is_in_progress: true,
        is_completed: false,
        last_accessed_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,sanity_practice_id',
      }
    );

    if (error) {
      console.error('Error starting practice:', error);
    } else {
      progressEventEmitter.emit();
    }
  } catch (error) {
    console.error('Error in startPractice:', error);
  }
}

export async function updatePracticeProgress(
  practiceId: string,
  currentPageNumber: number
): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient
      .from(TABLE)
      .update({
        current_page_number: currentPageNumber,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('sanity_practice_id', practiceId);

    if (error) {
      console.error('Error updating practice progress:', error);
    } else {
      progressEventEmitter.emit();
    }
  } catch (error) {
    console.error('Error in updatePracticeProgress:', error);
  }
}

export async function completePractice(practiceId: string): Promise<void> {
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
      .eq('sanity_practice_id', practiceId);

    if (error) {
      console.error('Error completing practice:', error);
    } else {
      progressEventEmitter.emit();
    }
  } catch (error) {
    console.error('Error in completePractice:', error);
  }
}
