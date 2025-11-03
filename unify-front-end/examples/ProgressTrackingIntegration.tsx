// =============================================
// PROGRESS TRACKING INTEGRATION EXAMPLES
// =============================================

import React, { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useLessonProgress } from '@/hooks/progress/useLessonProgress';
import { useSubmoduleProgress } from '@/hooks/progress/useSubmoduleProgress';
import { useModuleProgress } from '@/hooks/progress/useModuleProgress';
import { useProgressTracking } from '@/context/ProgressTrackingContext';

// =============================================
// EXAMPLE 1: Lesson Page Integration
// =============================================

export function LessonPageWithProgress() {
  const { moduleId, submoduleId, lessonId, pageNum } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    lessonId: string;
    pageNum: string;
  }>();

  const currentPage = parseInt(pageNum || '1');

  // Use the progress tracking hook
  const {
    lessonProgress,
    isLoading,
    error,
    startLesson,
    updateProgress,
    completeLesson,
    trackPageVisit,
    completePage,
  } = useLessonProgress(lessonId || '', submoduleId || '', moduleId || '');

  // Track page visit when component mounts
  useEffect(() => {
    if (lessonId && submoduleId && moduleId) {
      // Start lesson if not already started
      if (!lessonProgress) {
        startLesson(lessonId, submoduleId, moduleId);
      }

      // Track page visit
      trackPageVisit('lesson', `lesson_${currentPage}`, currentPage);

      // Update current progress
      updateProgress('lesson', currentPage);
    }
  }, [lessonId, submoduleId, moduleId, currentPage]);

  // Handle page completion
  const handlePageComplete = async () => {
    await completePage(lessonId || '', 'lesson', `lesson_${currentPage}`);

    // Check if lesson is complete
    if (currentPage === totalPages) {
      await completeLesson();
    }
  };

  return (
    // Your existing lesson page JSX here
    <div>
      {/* Progress indicators */}
      {lessonProgress && (
        <div>
          <p>Lesson Progress: {lessonProgress.progress_percent}%</p>
          <p>Current Page: {lessonProgress.current_page_number}</p>
          <p>Is Completed: {lessonProgress.is_completed ? 'Yes' : 'No'}</p>
        </div>
      )}

      {/* Your existing content */}
    </div>
  );
}

// =============================================
// EXAMPLE 2: Activity Page Integration
// =============================================

export function ActivityPageWithProgress() {
  const { moduleId, submoduleId, lessonId, pageNum } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    lessonId: string;
    pageNum: string;
  }>();

  const currentPage = parseInt(pageNum || '1');

  const { lessonProgress, trackPageVisit, completePage } = useLessonProgress(
    lessonId || '',
    submoduleId || '',
    moduleId || ''
  );

  // Track activity page visit
  useEffect(() => {
    if (lessonId && submoduleId && moduleId) {
      trackPageVisit('activity', `activity_${currentPage}`, currentPage);
    }
  }, [lessonId, submoduleId, moduleId, currentPage]);

  // Handle activity completion
  const handleActivityComplete = async () => {
    await completePage(lessonId || '', 'activity', `activity_${currentPage}`);
  };

  return <div>{/* Your existing activity page JSX here */}</div>;
}

// =============================================
// EXAMPLE 3: Quiz Page Integration
// =============================================

export function QuizPageWithProgress() {
  const { moduleId, submoduleId, lessonId, quizId, questionNum } =
    useLocalSearchParams<{
      moduleId: string;
      submoduleId: string;
      lessonId: string;
      quizId: string;
      questionNum: string;
    }>();

  const currentQuestion = parseInt(questionNum || '1');

  const { lessonProgress, trackPageVisit, completePage } = useLessonProgress(
    lessonId || '',
    submoduleId || '',
    moduleId || ''
  );

  // Track quiz question visit
  useEffect(() => {
    if (lessonId && submoduleId && moduleId && quizId) {
      trackPageVisit(
        'quiz',
        `quiz_${quizId}_question_${currentQuestion}`,
        currentQuestion,
        quizId,
        currentQuestion
      );
    }
  }, [lessonId, submoduleId, moduleId, quizId, currentQuestion]);

  // Handle quiz completion
  const handleQuizComplete = async () => {
    await completePage(lessonId || '', 'quiz', `quiz_${quizId}`);
  };

  return <div>{/* Your existing quiz page JSX here */}</div>;
}

// =============================================
// EXAMPLE 4: Map Component Integration
// =============================================

export function MapWithProgress() {
  const { moduleId, submoduleId } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
  }>();

  // Use multiple progress hooks
  const { moduleProgress } = useModuleProgress(moduleId || '');
  const { submoduleProgress } = useSubmoduleProgress(
    submoduleId || '',
    moduleId || ''
  );

  return (
    <div>
      {/* Module progress */}
      {moduleProgress && (
        <div>
          <p>Module Progress: {moduleProgress.progress_percent}%</p>
          <p>
            Completed Submodules: {moduleProgress.completed_submodules}/
            {moduleProgress.total_submodules}
          </p>
        </div>
      )}

      {/* Submodule progress */}
      {submoduleProgress && (
        <div>
          <p>Submodule Progress: {submoduleProgress.progress_percent}%</p>
          <p>
            Completed Lessons: {submoduleProgress.completed_lessons}/
            {submoduleProgress.total_lessons}
          </p>
        </div>
      )}

      {/* Your existing map JSX here */}
    </div>
  );
}

// =============================================
// EXAMPLE 5: Context Provider Integration
// =============================================

export function AppWithProgressTracking() {
  return (
    <ProgressTrackingProvider>
      {/* Your existing app components */}
    </ProgressTrackingProvider>
  );
}

// =============================================
// EXAMPLE 6: Using Context in Components
// =============================================

export function ComponentUsingContext() {
  const { state, actions } = useProgressTracking();

  const handleStartLesson = async () => {
    await actions.startLesson('lesson-id', 'submodule-id', 'module-id');
  };

  const handleCompletePage = async () => {
    await actions.completePage('lesson-id', 'lesson', 'lesson_1');
  };

  return (
    <div>
      <p>Module Progress: {state.moduleProgress}%</p>
      <p>Submodule Progress: {state.submoduleProgress}%</p>
      <p>Lesson Progress: {state.lessonProgress}%</p>

      <button onClick={handleStartLesson}>Start Lesson</button>
      <button onClick={handleCompletePage}>Complete Page</button>
    </div>
  );
}

// =============================================
// EXAMPLE 7: Progress Calculation
// =============================================

export function ProgressCalculationExample() {
  const { api } = useProgressTracking();

  const calculateProgress = async () => {
    const moduleProgress = await api.calculateModuleProgress('module-id');
    const submoduleProgress =
      await api.calculateSubmoduleProgress('submodule-id');
    const lessonProgress = await api.calculateLessonProgress('lesson-id');

    console.log('Module Progress:', moduleProgress);
    console.log('Submodule Progress:', submoduleProgress);
    console.log('Lesson Progress:', lessonProgress);
  };

  return (
    <div>
      <button onClick={calculateProgress}>Calculate Progress</button>
    </div>
  );
}
