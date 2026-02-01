/**
 * Computes the "Learn" deep link for a submodule (intro, lesson page, activity, quiz, or ending).
 * Used when user taps "Learn" on the submodule index.
 */
export function getLearnHref(
  moduleId: string,
  submoduleId: string,
  submodule: {
    _id: string;
    intro_pages?: unknown[];
    lessons?: Array<{
      _id: string;
      pages?: unknown[];
      activity_pages?: unknown[];
      quizzes?: Array<{ _id: string; questions?: unknown[] }>;
      ending_pages?: unknown[];
    }>;
  } | null,
  lessonProgresses: Array<{
    sanity_lesson_id: string;
    is_completed?: boolean;
    is_in_progress?: boolean;
    current_page_type?: string;
    current_page_number?: number;
    current_quiz_id?: string;
    current_question_number?: number;
  }> | null
): string | null {
  if (!submodule) return null;

  const base = `/(tabs)/Learn/modules/${moduleId}/${submoduleId}`;

  // No progress or no lessons: start at intro or first lesson
  if (
    !lessonProgresses ||
    lessonProgresses.length === 0 ||
    !submodule.lessons?.length
  ) {
    if (
      submodule.intro_pages &&
      Array.isArray(submodule.intro_pages) &&
      submodule.intro_pages.length > 0
    ) {
      return `${base}/intro/1`;
    }
    if (submodule.lessons?.[0]?._id) {
      return `${base}/lessons/${submodule.lessons[0]._id}/pages/1`;
    }
    return null;
  }

  const lessonProgressData: Record<
    string,
    { is_completed: boolean; is_in_progress: boolean }
  > = {};
  for (const lp of lessonProgresses) {
    if (lp.sanity_lesson_id) {
      lessonProgressData[lp.sanity_lesson_id] = {
        is_completed: Boolean(lp.is_completed),
        is_in_progress: Boolean(lp.is_in_progress),
      };
    }
  }
  for (const lesson of submodule.lessons || []) {
    if (lesson._id && !lessonProgressData[lesson._id]) {
      lessonProgressData[lesson._id] = {
        is_completed: false,
        is_in_progress: false,
      };
    }
  }

  let activeLesson: (typeof submodule.lessons)[0] | null = null;
  let activeLessonProgress: (typeof lessonProgresses)[0] | null = null;

  for (let i = 0; i < (submodule.lessons?.length || 0); i++) {
    const lesson = submodule.lessons![i];
    if (!lesson?._id) continue;
    const lessonProgress = lessonProgressData[lesson._id];
    const isCompleted = lessonProgress?.is_completed ?? false;
    const isInProgress = lessonProgress?.is_in_progress ?? false;
    let isActive = false;
    if (isInProgress) {
      isActive = true;
    } else if (i === 0) {
      isActive = true;
    } else {
      const prev = submodule.lessons![i - 1];
      if (prev?._id) {
        isActive = Boolean(lessonProgressData[prev._id]?.is_completed);
      }
    }
    if (isActive && !isCompleted) {
      activeLesson = lesson;
      activeLessonProgress =
        lessonProgresses.find((p: any) => p.sanity_lesson_id === lesson._id) ??
        null;
      break;
    }
  }

  if (!activeLesson?._id) {
    if (
      submodule.intro_pages &&
      Array.isArray(submodule.intro_pages) &&
      submodule.intro_pages.length > 0
    ) {
      return `${base}/intro/1`;
    }
    if (submodule.lessons?.[0]?._id) {
      return `${base}/lessons/${submodule.lessons[0]._id}/pages/1`;
    }
    return null;
  }

  if (activeLessonProgress?.is_in_progress) {
    const currentPageType = activeLessonProgress.current_page_type || 'lesson';
    const currentPageNumber = Math.max(
      1,
      Number(activeLessonProgress.current_page_number) || 1
    );
    if (currentPageType === 'intro') {
      return `${base}/intro/${currentPageNumber}`;
    }
    if (currentPageType === 'activity') {
      return `${base}/lessons/${activeLesson._id}/activities/${currentPageNumber}`;
    }
    if (currentPageType === 'quiz') {
      const quizId = activeLessonProgress.current_quiz_id || '';
      const questionNumber = Math.max(
        1,
        Number(activeLessonProgress.current_question_number) || 1
      );
      if (quizId) {
        return `${base}/lessons/${activeLesson._id}/quizzes/${quizId}/pages/${questionNumber}`;
      }
    }
    return `${base}/lessons/${activeLesson._id}/pages/${currentPageNumber}`;
  }

  return `${base}/lessons/${activeLesson._id}/pages/1`;
}
