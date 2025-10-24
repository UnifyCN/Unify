import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getModuleProgress, 
  getSubmoduleProgress, 
  getLessonProgress,
  startModule,
  startSubmodule,
  startLesson,
  completeModule,
  completeSubmodule,
  completeLesson,
  trackPageVisit,
  completePage,
  startQuizAttempt,
  submitQuizAnswer,
  completeQuizAttempt,
  saveActivityInput
} from '@/services/progress/progressService';
import { 
  UserModuleProgress, 
  UserSubmoduleProgress, 
  UserLessonProgress,
  ProgressTrackingState,
  ProgressTrackingActions,
  ProgressTrackingAPI
} from '@/types/progress';

interface ProgressTrackingContextType {
  state: ProgressTrackingState;
  actions: ProgressTrackingActions;
  api: ProgressTrackingAPI;
}

const ProgressTrackingContext = createContext<ProgressTrackingContextType | undefined>(undefined);

interface ProgressTrackingProviderProps {
  children: React.ReactNode;
  moduleId?: string;
  submoduleId?: string;
  lessonId?: string;
}

export function ProgressTrackingProvider({ 
  children, 
  moduleId, 
  submoduleId, 
  lessonId 
}: ProgressTrackingProviderProps) {
  // State
  const [currentLesson, setCurrentLesson] = useState<UserLessonProgress | null>(null);
  const [currentPage, setCurrentPage] = useState<any>(null);
  const [moduleProgress, setModuleProgress] = useState(0);
  const [submoduleProgress, setSubmoduleProgress] = useState(0);
  const [lessonProgress, setLessonProgress] = useState(0);
  const [isModuleCompleted, setIsModuleCompleted] = useState(false);
  const [isSubmoduleCompleted, setIsSubmoduleCompleted] = useState(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [canAccessNextLesson, setCanAccessNextLesson] = useState(false);
  const [canAccessNextSubmodule, setCanAccessNextSubmodule] = useState(false);
  const [canAccessNextModule, setCanAccessNextModule] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch progress data
  const fetchProgress = useCallback(async () => {
    if (!moduleId || !submoduleId || !lessonId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [module, submodule, lesson] = await Promise.all([
        getModuleProgress(moduleId),
        getSubmoduleProgress(submoduleId),
        getLessonProgress(lessonId)
      ]);

      setModuleProgress(module?.progress_percent || 0);
      setSubmoduleProgress(submodule?.progress_percent || 0);
      setLessonProgress(lesson?.progress_percent || 0);
      setIsModuleCompleted(module?.is_completed || false);
      setIsSubmoduleCompleted(submodule?.is_completed || false);
      setIsLessonCompleted(lesson?.is_completed || false);
      setCurrentLesson(lesson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress');
    } finally {
      setIsLoading(false);
    }
  }, [moduleId, submoduleId, lessonId]);

  // Actions
  const handleStartLesson = useCallback(async (lessonId: string, submoduleId: string, moduleId: string) => {
    try {
      await startLesson(lessonId, submoduleId, moduleId);
      await fetchProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start lesson');
    }
  }, [fetchProgress]);

  const handleStartSubmodule = useCallback(async (submoduleId: string, moduleId: string) => {
    try {
      await startSubmodule(submoduleId, moduleId);
      await fetchProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start submodule');
    }
  }, [fetchProgress]);

  const handleStartModule = useCallback(async (moduleId: string) => {
    try {
      await startModule(moduleId);
      await fetchProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start module');
    }
  }, [fetchProgress]);

  const handleUpdateLessonProgress = useCallback(async (
    lessonId: string, 
    pageType: 'intro' | 'lesson' | 'activity' | 'quiz', 
    pageNumber: number
  ) => {
    try {
      await updateLessonProgress(lessonId, pageType, pageNumber);
      await fetchProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lesson progress');
    }
  }, [fetchProgress]);

  const handleCompletePage = useCallback(async (
    lessonId: string, 
    pageType: 'intro' | 'lesson' | 'activity' | 'quiz', 
    pageKey: string
  ) => {
    try {
      await completePage(lessonId, pageType, pageKey);
      await fetchProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete page');
    }
  }, [fetchProgress]);

  const handleCompleteLesson = useCallback(async (lessonId: string) => {
    try {
      await completeLesson(lessonId);
      await fetchProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete lesson');
    }
  }, [fetchProgress]);

  const handleCompleteSubmodule = useCallback(async (submoduleId: string) => {
    try {
      await completeSubmodule(submoduleId);
      await fetchProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete submodule');
    }
  }, [fetchProgress]);

  const handleCompleteModule = useCallback(async (moduleId: string) => {
    try {
      await completeModule(moduleId);
      await fetchProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete module');
    }
  }, [fetchProgress]);

  const handleStartQuizAttempt = useCallback(async (quizId: string, lessonId: string) => {
    try {
      if (!submoduleId || !moduleId) return null;
      return await startQuizAttempt(quizId, lessonId, submoduleId, moduleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start quiz attempt');
      return null;
    }
  }, [submoduleId, moduleId]);

  const handleSubmitQuizAnswer = useCallback(async (
    attemptId: string, 
    questionId: string, 
    answer: any
  ) => {
    try {
      await submitQuizAnswer(attemptId, questionId, 'multiple_choice', answer, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz answer');
    }
  }, []);

  const handleCompleteQuizAttempt = useCallback(async (
    attemptId: string, 
    score: number, 
    totalQuestions: number, 
    correctAnswers: number
  ) => {
    try {
      await completeQuizAttempt(attemptId, score, totalQuestions, correctAnswers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete quiz attempt');
    }
  }, []);

  const handleSaveActivityInput = useCallback(async (
    lessonId: string, 
    pageKey: string, 
    fieldKey: string, 
    value: string
  ) => {
    try {
      if (!submoduleId || !moduleId) return;
      await saveActivityInput(lessonId, submoduleId, moduleId, pageKey, fieldKey, value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save activity input');
    }
  }, [submoduleId, moduleId]);

  // API functions
  const api: ProgressTrackingAPI = {
    getModuleProgress: useCallback(async (moduleId: string) => {
      return await getModuleProgress(moduleId);
    }, []),
    
    getSubmoduleProgress: useCallback(async (submoduleId: string) => {
      return await getSubmoduleProgress(submoduleId);
    }, []),
    
    getLessonProgress: useCallback(async (lessonId: string) => {
      return await getLessonProgress(lessonId);
    }, []),
    
    getPageProgress: useCallback(async (lessonId: string, pageType: string, pageKey: string) => {
      // Implementation would go here
      return null;
    }, []),
    
    getAllUserProgress: useCallback(async () => {
      // Implementation would go here
      return {
        modules: [],
        submodules: [],
        lessons: [],
        pages: []
      };
    }, []),
    
    calculateModuleProgress: useCallback(async (moduleId: string) => {
      // Implementation would go here
      return {
        totalPages: 0,
        completedPages: 0,
        progressPercent: 0,
        isCompleted: false,
        isInProgress: false,
        totalSubmodules: 0,
        completedSubmodules: 0,
        submodulesProgress: []
      };
    }, []),
    
    calculateSubmoduleProgress: useCallback(async (submoduleId: string) => {
      // Implementation would go here
      return {
        totalPages: 0,
        completedPages: 0,
        progressPercent: 0,
        isCompleted: false,
        isInProgress: false,
        totalLessons: 0,
        completedLessons: 0,
        lessonsProgress: []
      };
    }, []),
    
    calculateLessonProgress: useCallback(async (lessonId: string) => {
      // Implementation would go here
      return {
        totalPages: 0,
        completedPages: 0,
        progressPercent: 0,
        isCompleted: false,
        isInProgress: false,
        totalLessonPages: 0,
        completedLessonPages: 0,
        totalActivityPages: 0,
        completedActivityPages: 0,
        totalQuizPages: 0,
        completedQuizPages: 0
      };
    }, []),
    
    canAccessLesson: useCallback(async (lessonId: string) => {
      // Implementation would go here
      return true;
    }, []),
    
    canAccessSubmodule: useCallback(async (submoduleId: string) => {
      // Implementation would go here
      return true;
    }, []),
    
    canAccessModule: useCallback(async (moduleId: string) => {
      // Implementation would go here
      return true;
    }, [])
  };

  // Initialize progress tracking
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const state: ProgressTrackingState = {
    currentLesson,
    currentPage,
    moduleProgress,
    submoduleProgress,
    lessonProgress,
    isModuleCompleted,
    isSubmoduleCompleted,
    isLessonCompleted,
    canAccessNextLesson,
    canAccessNextSubmodule,
    canAccessNextModule,
    isLoading,
    error
  };

  const actions: ProgressTrackingActions = {
    startLesson: handleStartLesson,
    startSubmodule: handleStartSubmodule,
    startModule: handleStartModule,
    updateLessonProgress: handleUpdateLessonProgress,
    completePage: handleCompletePage,
    completeLesson: handleCompleteLesson,
    completeSubmodule: handleCompleteSubmodule,
    completeModule: handleCompleteModule,
    startQuizAttempt: handleStartQuizAttempt,
    submitQuizAnswer: handleSubmitQuizAnswer,
    completeQuizAttempt: handleCompleteQuizAttempt,
    saveActivityInput: handleSaveActivityInput,
    startRetake: async () => {},
    completeRetake: async () => {}
  };

  const value: ProgressTrackingContextType = {
    state,
    actions,
    api
  };

  return (
    <ProgressTrackingContext.Provider value={value}>
      {children}
    </ProgressTrackingContext.Provider>
  );
}

export function useProgressTracking(): ProgressTrackingContextType {
  const context = useContext(ProgressTrackingContext);
  if (context === undefined) {
    throw new Error('useProgressTracking must be used within a ProgressTrackingProvider');
  }
  return context;
}


