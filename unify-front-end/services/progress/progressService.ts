import { progressClient } from './progressClient';
import {
  UserLessonProgress,
  UserSubmoduleProgress,
  UserModuleProgress,
  UserPageProgress,
} from '@/types/progress';
import { progressEventEmitter } from '@/utils/progressEventEmitter';

// =============================================
// LESSON PROGRESS SERVICE
// =============================================

export async function getLessonProgress(
  lessonId: string
): Promise<UserLessonProgress | null> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return null;

    const { data, error } = await progressClient
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('sanity_lesson_id', lessonId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching lesson progress:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getLessonProgress:', error);
    return null;
  }
}

export async function getLessonProgressesBySubmodule(
  submoduleId: string
): Promise<Record<string, UserLessonProgress>> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return {};

    const { data, error } = await progressClient
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('sanity_submodule_id', submoduleId);

    if (error) {
      console.error('Error fetching lesson progresses by submodule:', error);
      return {};
    }

    const result: Record<string, UserLessonProgress> = {};
    for (const row of data || []) {
      if (row?.sanity_lesson_id) {
        result[row.sanity_lesson_id] = row;
      }
    }

    return result;
  } catch (error) {
    console.error('Error in getLessonProgressesBySubmodule:', error);
    return {};
  }
}

async function startLesson(
  lessonId: string,
  submoduleId: string,
  moduleId: string
): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient.from('user_lesson_progress').upsert(
      {
        user_id: user.id,
        sanity_lesson_id: lessonId,
        sanity_submodule_id: submoduleId,
        sanity_module_id: moduleId,
        is_in_progress: true,
        current_page_type: 'lesson',
        current_page_number: 1,
        current_question_number: 1,
        last_accessed_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,sanity_lesson_id',
      }
    );

    if (error) {
      console.error('Error starting lesson:', error);
    } else {
      // Emit progress update event
      progressEventEmitter.emit();
    }
  } catch (error) {
    console.error('Error in startLesson:', error);
  }
}

export async function updateLessonProgress(
  lessonId: string,
  submoduleId: string,
  moduleId: string,
  pageType: 'intro' | 'lesson' | 'activity' | 'quiz',
  pageNumber: number,
  totalPages: number,
  quizId?: string,
  questionNumber?: number
): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    // Page N clicked → pages 1..N are now done
    const completedPages = Math.min(pageNumber, totalPages);
    const progressPercent =
      totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0;

    const upsertData: any = {
      user_id: user.id,
      sanity_lesson_id: lessonId,
      sanity_submodule_id: submoduleId,
      sanity_module_id: moduleId,
      is_in_progress: true,
      current_page_type: pageType,
      current_page_number: pageNumber,
      total_pages: totalPages,
      completed_pages: completedPages,
      progress_percent: progressPercent,
      last_accessed_at: new Date().toISOString(),
    };

    if (quizId) upsertData.current_quiz_id = quizId;
    if (questionNumber) upsertData.current_question_number = questionNumber;

    const { error } = await progressClient
      .from('user_lesson_progress')
      .upsert(upsertData, { onConflict: 'user_id,sanity_lesson_id' });

    if (error) {
      console.error('Error updating lesson progress:', error);
    } else {
      progressEventEmitter.emit();
    }
  } catch (error) {
    console.error('Error in updateLessonProgress:', error);
  }
}

async function completeLesson(lessonId: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient
      .from('user_lesson_progress')
      .update({
        is_completed: true,
        is_in_progress: false,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('sanity_lesson_id', lessonId);

    if (error) {
      console.error('Error completing lesson:', error);
    } else {
      // Emit progress update event
      progressEventEmitter.emit();
    }
  } catch (error) {
    console.error('Error in completeLesson:', error);
  }
}

// =============================================
// PAGE PROGRESS SERVICE
// =============================================

async function trackPageVisit(
  lessonId: string,
  submoduleId: string,
  moduleId: string,
  pageType: 'intro' | 'lesson' | 'activity' | 'quiz',
  pageKey: string,
  pageNumber: number,
  quizId?: string,
  questionNumber?: number
): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient.from('user_page_progress').upsert(
      {
        user_id: user.id,
        sanity_lesson_id: lessonId,
        sanity_submodule_id: submoduleId,
        sanity_module_id: moduleId,
        page_type: pageType,
        page_key: pageKey,
        page_number: pageNumber,
        sanity_quiz_id: quizId,
        question_number: questionNumber,
        is_visited: true,
        first_visited_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,sanity_lesson_id,page_type,page_key',
      }
    );

    if (error) {
      console.error('Error tracking page visit:', error);
    } else {
      // Emit progress update event (page visits are progress updates)
      progressEventEmitter.emit();
    }
  } catch (error) {
    console.error('Error in trackPageVisit:', error);
  }
}

async function completePage(
  lessonId: string,
  pageType: 'intro' | 'lesson' | 'activity' | 'quiz',
  pageKey: string
): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient
      .from('user_page_progress')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('sanity_lesson_id', lessonId)
      .eq('page_type', pageType)
      .eq('page_key', pageKey);

    if (error) {
      console.error('Error completing page:', error);
    } else {
      // Emit progress update event
      progressEventEmitter.emit();
    }
  } catch (error) {
    console.error('Error in completePage:', error);
  }
}

// =============================================
// SUBMODULE PROGRESS SERVICE
// =============================================

async function getSubmoduleProgress(
  submoduleId: string,
  totalLessonsInSubmodule?: number
): Promise<UserSubmoduleProgress | null> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return null;

    // Get all lesson progress for this submodule
    const { data: lessonProgresses, error: lessonError } = await progressClient
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('sanity_submodule_id', submoduleId);

    if (lessonError) {
      console.error('Error fetching lesson progress:', lessonError);
      return null;
    }

    // Calculate progress based on completed lessons
    const completedLessons =
      lessonProgresses?.filter(lesson => lesson.is_completed) || [];
    const totalLessons =
      totalLessonsInSubmodule || lessonProgresses?.length || 0;
    const progressPercent =
      totalLessons > 0
        ? Math.round((completedLessons.length / totalLessons) * 100)
        : 0;
    const isCompleted =
      completedLessons.length === totalLessons && totalLessons > 0;

    // Get or create submodule progress record
    const { data: existingProgress, error: fetchError } = await progressClient
      .from('user_submodule_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('sanity_submodule_id', submoduleId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching submodule progress:', fetchError);
      return null;
    }

    // Update or create submodule progress
    const progressData = {
      user_id: user.id,
      sanity_submodule_id: submoduleId,
      sanity_module_id: lessonProgresses?.[0]?.sanity_module_id || '',
      progress_percent: progressPercent,
      total_lessons: totalLessons,
      completed_lessons: completedLessons.length,
      is_completed: isCompleted,
      last_accessed_at: new Date().toISOString(),
      ...(isCompleted && { completed_at: new Date().toISOString() }),
    };

    const { data: updatedProgress, error: upsertError } = await progressClient
      .from('user_submodule_progress')
      .upsert(progressData, {
        onConflict: 'user_id,sanity_submodule_id',
      })
      .select('*')
      .single();

    if (upsertError) {
      console.error('Error updating submodule progress:', upsertError);
      return null;
    }

    return updatedProgress;
  } catch (error) {
    console.error('Error in getSubmoduleProgress:', error);
    return null;
  }
}

async function startSubmodule(
  submoduleId: string,
  moduleId: string
): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient
      .from('user_submodule_progress')
      .upsert(
        {
          user_id: user.id,
          sanity_submodule_id: submoduleId,
          sanity_module_id: moduleId,
          last_accessed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,sanity_submodule_id',
        }
      );

    if (error) {
      console.error('Error starting submodule:', error);
    }
  } catch (error) {
    console.error('Error in startSubmodule:', error);
  }
}

async function completeSubmodule(submoduleId: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient
      .from('user_submodule_progress')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('sanity_submodule_id', submoduleId);

    if (error) {
      console.error('Error completing submodule:', error);
    }
  } catch (error) {
    console.error('Error in completeSubmodule:', error);
  }
}

// =============================================
// MODULE PROGRESS SERVICE
// =============================================

export async function getModuleProgress(
  moduleId: string
): Promise<UserModuleProgress | null> {
  try {
    if (!moduleId) {
      return null;
    }

    let user = null;
    try {
      const userResult = await progressClient.auth.getUser();
      user = userResult?.data?.user || null;
      if (userResult?.error) {
        const isSessionMissing =
          userResult.error?.name === 'AuthSessionMissingError' ||
          userResult.error?.message?.includes('Auth session missing');
        if (!isSessionMissing) {
          console.error(
            'Error getting user in getModuleProgress:',
            userResult.error
          );
        }
      }
    } catch (authError: any) {
      const isSessionMissing =
        authError?.name === 'AuthSessionMissingError' ||
        authError?.message?.includes('Auth session missing');
      if (!isSessionMissing) {
        console.error(
          'Exception getting user in getModuleProgress:',
          authError
        );
      }
      return null;
    }

    if (!user) return null;

    let data = null;
    let error = null;

    try {
      const result = await progressClient
        .from('user_module_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('sanity_module_id', moduleId)
        .single();

      data = result?.data || null;
      error = result?.error || null;
    } catch (queryError: any) {
      console.error('Exception querying module progress:', queryError);
      error = queryError;
    }

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching module progress:', error);
      return null;
    }

    return data;
  } catch (error: any) {
    console.error('Error in getModuleProgress:', error);
    return null;
  }
}

export async function startModule(moduleId: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient.from('user_module_progress').upsert(
      {
        user_id: user.id,
        sanity_module_id: moduleId,
        last_accessed_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,sanity_module_id',
      }
    );

    if (error) {
      console.error('Error starting module:', error);
    }
  } catch (error) {
    console.error('Error in startModule:', error);
  }
}

export async function completeModule(moduleId: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient
      .from('user_module_progress')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('sanity_module_id', moduleId);

    if (error) {
      console.error('Error completing module:', error);
    }
  } catch (error) {
    console.error('Error in completeModule:', error);
  }
}

// =============================================
// QUIZ PROGRESS SERVICE
// =============================================

async function startQuizAttempt(
  quizId: string,
  lessonId: string,
  submoduleId: string,
  moduleId: string
): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return null;

    // Get current attempt number
    const { data: existingAttempts } = await progressClient
      .from('user_quiz_attempts')
      .select('attempt_number')
      .eq('user_id', user.id)
      .eq('sanity_quiz_id', quizId)
      .order('attempt_number', { ascending: false })
      .limit(1);

    const attemptNumber = existingAttempts?.[0]?.attempt_number
      ? existingAttempts[0].attempt_number + 1
      : 1;

    const { data, error } = await progressClient
      .from('user_quiz_attempts')
      .insert({
        user_id: user.id,
        sanity_quiz_id: quizId,
        sanity_lesson_id: lessonId,
        sanity_submodule_id: submoduleId,
        sanity_module_id: moduleId,
        attempt_number: attemptNumber,
        total_questions: 0, // Will be updated as questions are answered
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error starting quiz attempt:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in startQuizAttempt:', error);
    return null;
  }
}

async function submitQuizAnswer(
  attemptId: string,
  questionId: string,
  questionType: string,
  answer: any,
  isCorrect: boolean
): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient.from('user_quiz_responses').upsert(
      {
        user_id: user.id,
        quiz_attempt_id: attemptId,
        sanity_question_id: questionId,
        question_type: questionType,
        user_answer: answer,
        is_correct: isCorrect,
        answered_at: new Date().toISOString(),
      },
      {
        onConflict: 'quiz_attempt_id,sanity_question_id',
      }
    );

    if (error) {
      console.error('Error submitting quiz answer:', error);
    }
  } catch (error) {
    console.error('Error in submitQuizAnswer:', error);
  }
}

async function completeQuizAttempt(
  attemptId: string,
  score: number,
  totalQuestions: number,
  correctAnswers: number
): Promise<void> {
  try {
    const { error } = await progressClient
      .from('user_quiz_attempts')
      .update({
        score_percent: score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        is_passed: score >= 70, // Assuming 70% is passing
        completed_at: new Date().toISOString(),
      })
      .eq('id', attemptId);

    if (error) {
      console.error('Error completing quiz attempt:', error);
    }
  } catch (error) {
    console.error('Error in completeQuizAttempt:', error);
  }
}

// =============================================
// ACTIVITY INPUT SERVICE
// =============================================

async function saveActivityInput(
  lessonId: string,
  submoduleId: string,
  moduleId: string,
  pageKey: string,
  fieldKey: string,
  value: string
): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    const { error } = await progressClient.from('user_activity_inputs').upsert(
      {
        user_id: user.id,
        sanity_lesson_id: lessonId,
        sanity_submodule_id: submoduleId,
        sanity_module_id: moduleId,
        activity_page_key: pageKey,
        input_field_key: fieldKey,
        input_value: value,
        is_submitted: true,
        submitted_at: new Date().toISOString(),
      },
      {
        onConflict:
          'user_id,sanity_lesson_id,activity_page_key,input_field_key',
      }
    );

    if (error) {
      console.error('Error saving activity input:', error);
    }
  } catch (error) {
    console.error('Error in saveActivityInput:', error);
  }
}
