// =============================================
// PROGRESS TRACKING TYPES
// Compatible with Sanity CMS Content Structure
// =============================================

export interface UserModuleProgress {
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
}

export interface UserSubmoduleProgress {
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
}

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

export interface UserQuizAttempt {
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
}

export interface UserQuizResponse {
  id: string;
  user_id: string;
  quiz_attempt_id: string;
  sanity_question_id: string;
  question_type: string;
  user_answer: any; // JSONB
  is_correct?: boolean;
  time_spent_seconds: number;
  answered_at: string;
}

export interface UserActivityInput {
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
}

export interface UserLessonRetake {
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
}

// =============================================
// PROGRESS TRACKING HOOK TYPES
// =============================================

export interface ProgressTrackingState {
  // Current lesson state
  currentLesson?: UserLessonProgress;
  currentPage?: UserPageProgress;
  
  // Progress percentages
  moduleProgress: number;
  submoduleProgress: number;
  lessonProgress: number;
  
  // Completion status
  isModuleCompleted: boolean;
  isSubmoduleCompleted: boolean;
  isLessonCompleted: boolean;
  
  // Navigation state
  canAccessNextLesson: boolean;
  canAccessNextSubmodule: boolean;
  canAccessNextModule: boolean;
  
  // Loading states
  isLoading: boolean;
  error?: string;
}

export interface ProgressTrackingActions {
  // Start tracking
  startLesson: (lessonId: string, submoduleId: string, moduleId: string) => Promise<void>;
  startSubmodule: (submoduleId: string, moduleId: string) => Promise<void>;
  startModule: (moduleId: string) => Promise<void>;
  
  // Update progress
  updateLessonProgress: (lessonId: string, pageType: string, pageNumber: number) => Promise<void>;
  completePage: (lessonId: string, pageType: string, pageKey: string) => Promise<void>;
  completeLesson: (lessonId: string) => Promise<void>;
  completeSubmodule: (submoduleId: string) => Promise<void>;
  completeModule: (moduleId: string) => Promise<void>;
  
  // Quiz tracking
  startQuizAttempt: (quizId: string, lessonId: string) => Promise<string>; // Returns attempt ID
  submitQuizAnswer: (attemptId: string, questionId: string, answer: any) => Promise<void>;
  completeQuizAttempt: (attemptId: string, score: number) => Promise<void>;
  
  // Activity input tracking
  saveActivityInput: (lessonId: string, pageKey: string, fieldKey: string, value: string) => Promise<void>;
  
  // Retake tracking
  startRetake: (lessonId: string) => Promise<void>;
  completeRetake: (lessonId: string) => Promise<void>;
}

// =============================================
// PROGRESS CALCULATION TYPES
// =============================================

export interface ProgressCalculation {
  totalPages: number;
  completedPages: number;
  progressPercent: number;
  isCompleted: boolean;
  isInProgress: boolean;
}

export interface LessonProgressCalculation extends ProgressCalculation {
  totalLessonPages: number;
  completedLessonPages: number;
  totalActivityPages: number;
  completedActivityPages: number;
  totalQuizPages: number;
  completedQuizPages: number;
}

export interface SubmoduleProgressCalculation extends ProgressCalculation {
  totalLessons: number;
  completedLessons: number;
  lessonsProgress: LessonProgressCalculation[];
}

export interface ModuleProgressCalculation extends ProgressCalculation {
  totalSubmodules: number;
  completedSubmodules: number;
  submodulesProgress: SubmoduleProgressCalculation[];
}

// =============================================
// PROGRESS TRACKING API TYPES
// =============================================

export interface ProgressTrackingAPI {
  // Get progress
  getModuleProgress: (moduleId: string) => Promise<UserModuleProgress | null>;
  getSubmoduleProgress: (submoduleId: string) => Promise<UserSubmoduleProgress | null>;
  getLessonProgress: (lessonId: string) => Promise<UserLessonProgress | null>;
  getPageProgress: (lessonId: string, pageType: string, pageKey: string) => Promise<UserPageProgress | null>;
  
  // Get all progress for a user
  getAllUserProgress: () => Promise<{
    modules: UserModuleProgress[];
    submodules: UserSubmoduleProgress[];
    lessons: UserLessonProgress[];
    pages: UserPageProgress[];
  }>;
  
  // Calculate progress
  calculateModuleProgress: (moduleId: string) => Promise<ModuleProgressCalculation>;
  calculateSubmoduleProgress: (submoduleId: string) => Promise<SubmoduleProgressCalculation>;
  calculateLessonProgress: (lessonId: string) => Promise<LessonProgressCalculation>;
  
  // Check access permissions
  canAccessLesson: (lessonId: string) => Promise<boolean>;
  canAccessSubmodule: (submoduleId: string) => Promise<boolean>;
  canAccessModule: (moduleId: string) => Promise<boolean>;
}

// =============================================
// PROGRESS TRACKING CONTEXT TYPES
// =============================================

export interface ProgressTrackingContextType {
  state: ProgressTrackingState;
  actions: ProgressTrackingActions;
  api: ProgressTrackingAPI;
}

// =============================================
// PROGRESS TRACKING UTILITY TYPES
// =============================================

export interface ProgressSummary {
  moduleId: string;
  submoduleId: string;
  lessonId: string;
  progress: number;
  isCompleted: boolean;
  isInProgress: boolean;
  lastAccessed: string;
}

export interface ProgressAnalytics {
  totalTimeSpent: number; // in seconds
  averageTimePerPage: number; // in seconds
  completionRate: number; // percentage
  retakeCount: number;
  quizScores: number[];
  averageQuizScore: number;
}


