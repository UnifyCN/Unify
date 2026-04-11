import { useCallback } from 'react';
import { progressClient } from '@/services/progress/progressClient';
import { cachedProgressService } from '@/services/progress/cachedProgressService';
import { progressEventEmitter } from '@/utils/progressEventEmitter';
import { updateLessonProgress } from '@/services/progress/progressService';

export function useLessonProgress() {
  // Save lesson completion to database
  const saveLessonCompletion = useCallback(
    async (
      lessonId: string,
      submoduleId: string,
      moduleId: string,
      totalPages: number
    ) => {
      try {
        // Get the current user
        const {
          data: { user },
          error: authError,
        } = await progressClient.auth.getUser();

        if (authError || !user) {
          console.error('No authenticated user found:', authError);
          return false;
        }

        const { data, error } = await progressClient
          .from('user_lesson_progress')
          .upsert(
            {
              user_id: user.id, // Use actual authenticated user ID
              sanity_lesson_id: lessonId,
              sanity_submodule_id: submoduleId,
              sanity_module_id: moduleId,
              progress_percent: 100.0,
              total_pages: totalPages,
              completed_pages: totalPages,
              is_completed: true,
              is_in_progress: false,
              completed_at: new Date().toISOString(),
              last_accessed_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,sanity_lesson_id',
            }
          );

        if (error) {
          console.error('Error saving lesson completion:', error);
          return false;
        }

        // Update the progress cache
        await cachedProgressService.updateProgressOnLessonCompletion(
          moduleId,
          submoduleId
        );

        // Emit progress update event to trigger refetch in learn index
        progressEventEmitter.emit();

        return true;
      } catch (error) {
        console.error('Error saving lesson completion:', error);
        return false;
      }
    },
    []
  );

  /**
   * Persists the user's current page position so they can resume exactly where
   * they left off. Call this fire-and-forget on every Next press.
   */
  const saveCurrentPage = useCallback(
    (
      lessonId: string,
      submoduleId: string,
      moduleId: string,
      pageType: 'intro' | 'lesson' | 'activity' | 'quiz',
      pageNumber: number,
      totalPages: number,
      quizId?: string,
      questionNumber?: number
    ) => {
      if (!lessonId || !submoduleId || !moduleId) return;
      updateLessonProgress(
        lessonId,
        submoduleId,
        moduleId,
        pageType,
        pageNumber,
        totalPages,
        quizId,
        questionNumber
      ).then(() => {
        // Invalidate the cached progress so the submodule index gets fresh data
        cachedProgressService.invalidate();
      });
    },
    []
  );

  return {
    saveLessonCompletion,
    saveCurrentPage,
  };
}
