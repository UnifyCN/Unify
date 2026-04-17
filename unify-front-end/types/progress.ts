// =============================================
// PROGRESS TRACKING TYPES
// Compatible with Sanity CMS Content Structure
// =============================================
//
// Only the types actually consumed by services/hooks live here.
// Module-level progress is tracked in `learn_progress` via
// `services/learn/moduleProgressService.ts` and typed by
// `ModuleProgressStatus` in `@/types/learn`.

export interface UserLessonProgress {
  id: string;
  user_id: string;
  sanity_lesson_id: string;
  sanity_submodule_id: string;
  sanity_module_id: string;
  progress_percent: number;
  total_pages: number;
  completed_pages: number;
  is_completed: boolean;
  is_in_progress: boolean;
  current_page_type?: 'intro' | 'lesson' | 'activity' | 'quiz';
  current_page_number: number;
  current_quiz_id?: string;
  current_question_number: number;
  started_at: string;
  completed_at?: string;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserPageProgress {
  id: string;
  user_id: string;
  sanity_lesson_id: string;
  sanity_submodule_id: string;
  sanity_module_id: string;
  page_type: 'intro' | 'lesson' | 'activity' | 'quiz';
  page_key: string;
  page_number: number;
  sanity_quiz_id?: string;
  question_number?: number;
  is_visited: boolean;
  is_completed: boolean;
  time_spent_seconds: number;
  first_visited_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

/** Task (submodule-level single-page content) progress – like one lesson page */
export interface UserTaskProgress {
  id: string;
  user_id: string;
  sanity_task_id: string;
  sanity_submodule_id: string;
  sanity_module_id: string;
  is_completed: boolean;
  is_in_progress: boolean;
  last_accessed_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

/** Practice (submodule-level quiz/activity) progress – separate from Learn lesson progress */
export interface UserPracticeProgress {
  id: string;
  user_id: string;
  sanity_practice_id: string;
  sanity_submodule_id: string;
  sanity_module_id: string;
  practice_type: 'quiz' | 'activity';
  current_page_number: number;
  is_completed: boolean;
  is_in_progress: boolean;
  last_accessed_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
