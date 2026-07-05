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

// =============================================
// PRACTICE ANSWER PERSISTENCE (typed inputs + selections)
// Stored in user_practice_answers. item_key = Sanity block _key, prefixed with
// PRACTICE_QUESTION_PREFIX for multiple-choice answers so restore can route each
// value back to the right state map (a block is only ever an input OR a question).
// =============================================

const ANSWERS_TABLE = 'user_practice_answers';
export const PRACTICE_QUESTION_PREFIX = 'q::';

export async function savePracticeAnswer(
  practiceId: string,
  submoduleId: string,
  moduleId: string,
  itemKey: string,
  answer: string | string[],
  isSubmitted = false
): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient.from(ANSWERS_TABLE).upsert(
      {
        user_id: user.id,
        sanity_practice_id: practiceId,
        sanity_submodule_id: submoduleId,
        sanity_module_id: moduleId,
        item_key: itemKey,
        answer,
        is_submitted: isSubmitted,
      },
      { onConflict: 'user_id,sanity_practice_id,item_key' }
    );

    if (error) {
      console.error('Error saving practice answer:', error);
    }
  } catch (error) {
    console.error('Error in savePracticeAnswer:', error);
  }
}

export interface RestoredPracticeAnswers {
  inputValues: Record<string, string>;
  questionAnswers: Record<string, string | string[]>;
  isSubmitted: boolean;
}

/** Loads previously-saved answers for a practice so a page can rehydrate on mount. */
export async function getPracticeAnswers(
  practiceId: string
): Promise<RestoredPracticeAnswers> {
  const empty: RestoredPracticeAnswers = {
    inputValues: {},
    questionAnswers: {},
    isSubmitted: false,
  };
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return empty;

    const { data, error } = await progressClient
      .from(ANSWERS_TABLE)
      .select('item_key, answer, is_submitted')
      .eq('user_id', user.id)
      .eq('sanity_practice_id', practiceId);

    if (error) {
      console.error('Error fetching practice answers:', error);
      return empty;
    }

    for (const row of data || []) {
      const key = row.item_key as string;
      if (row.is_submitted) empty.isSubmitted = true;
      if (key.startsWith(PRACTICE_QUESTION_PREFIX)) {
        empty.questionAnswers[key.slice(PRACTICE_QUESTION_PREFIX.length)] =
          row.answer as string | string[];
      } else {
        empty.inputValues[key] = (row.answer ?? '') as string;
      }
    }
    return empty;
  } catch (error) {
    console.error('Error in getPracticeAnswers:', error);
    return empty;
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
