import { supabase } from '@/lib/supabase';

// Use the existing Supabase client for progress tracking
export const progressClient = supabase;

// Progress tracking types (matching our schema)
export interface ProgressDatabase {
  user_module_progress: {
    id: string;
    user_id: string;
    sanity_module_id: string;
    progress_percent: number;
    total_pages: number;
    completed_pages: number;
    total_submodules: number;
    completed_submodules: number;
    is_completed: boolean;
    started_at: string;
    completed_at?: string;
    last_accessed_at: string;
    created_at: string;
    updated_at: string;
  };
  
  user_submodule_progress: {
    id: string;
    user_id: string;
    sanity_submodule_id: string;
    sanity_module_id: string;
    progress_percent: number;
    total_pages: number;
    completed_pages: number;
    total_lessons: number;
    completed_lessons: number;
    is_completed: boolean;
    started_at: string;
    completed_at?: string;
    last_accessed_at: string;
    created_at: string;
    updated_at: string;
  };
  
  user_lesson_progress: {
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
  };
  
  user_page_progress: {
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
  };
  
  user_quiz_attempts: {
    id: string;
    user_id: string;
    sanity_quiz_id: string;
    sanity_lesson_id: string;
    sanity_submodule_id: string;
    sanity_module_id: string;
    attempt_number: number;
    score_percent?: number;
    total_questions: number;
    correct_answers: number;
    is_passed: boolean;
    started_at: string;
    completed_at?: string;
    created_at: string;
  };
  
  user_quiz_responses: {
    id: string;
    user_id: string;
    quiz_attempt_id: string;
    sanity_question_id: string;
    question_type: string;
    user_answer: any;
    is_correct?: boolean;
    time_spent_seconds: number;
    answered_at: string;
  };
  
  user_activity_inputs: {
    id: string;
    user_id: string;
    sanity_lesson_id: string;
    sanity_submodule_id: string;
    sanity_module_id: string;
    activity_page_key: string;
    input_field_key: string;
    input_value?: string;
    is_submitted: boolean;
    submitted_at?: string;
    created_at: string;
    updated_at: string;
  };
  
  user_lesson_retakes: {
    id: string;
    user_id: string;
    sanity_lesson_id: string;
    sanity_submodule_id: string;
    sanity_module_id: string;
    retake_number: number;
    started_at: string;
    completed_at?: string;
    is_active: boolean;
    created_at: string;
  };
}

export default progressClient;
