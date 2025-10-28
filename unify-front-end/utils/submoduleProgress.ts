import { SanitySubmoduleWithLessons } from '@/types/sanity';

export interface SubmodulePageCounts {
  introPages: number;
  lessonPages: number;
  activityPages: number;
  quizPages: number;
  totalPages: number;
}

export interface CurrentProgress {
  currentPage: number;
  totalPages: number;
  progressPercentage: number;
}

/**
 * Calculate the total number of pages in a submodule
 */
export function calculateSubmodulePageCounts(
  submoduleData: SanitySubmoduleWithLessons | null
): SubmodulePageCounts {
  if (!submoduleData) {
    return {
      introPages: 0,
      lessonPages: 0,
      activityPages: 0,
      quizPages: 0,
      totalPages: 0,
    };
  }

  // Count intro pages
  const introPages = submoduleData.intro_pages?.length || 0;

  // Count lesson pages, activity pages, and quiz pages
  let lessonPages = 0;
  let activityPages = 0;
  let quizPages = 0;

  if (submoduleData.lessons) {
    submoduleData.lessons.forEach(lesson => {
      // Count lesson pages
      lessonPages += lesson.pages?.length || 0;

      // Count activity pages
      activityPages += lesson.activity_pages?.length || 0;

      // Count quiz pages (assuming each quiz has multiple questions/pages)
      if (lesson.quizzes) {
        lesson.quizzes.forEach(quiz => {
          quizPages += quiz.questions?.length || 0;
        });
      }
    });
  }

  const totalPages = introPages + lessonPages + activityPages + quizPages;

  return {
    introPages,
    lessonPages,
    activityPages,
    quizPages,
    totalPages,
  };
}

/**
 * Calculate current progress for intro pages
 */
export function calculateIntroProgress(
  submoduleData: SanitySubmoduleWithLessons | null,
  currentPage: number
): CurrentProgress {
  const pageCounts = calculateSubmodulePageCounts(submoduleData);

  // First page shows 1 progress, second page shows 2 progress, etc.
  const progressValue = currentPage;

  return {
    currentPage: progressValue,
    totalPages: pageCounts.totalPages,
    progressPercentage:
      pageCounts.totalPages > 0
        ? (progressValue / pageCounts.totalPages) * 100
        : 0,
  };
}

/**
 * Calculate current progress for lesson pages
 */
export function calculateLessonProgress(
  submoduleData: SanitySubmoduleWithLessons | null,
  lessonId: string,
  currentPage: number
): CurrentProgress {
  const pageCounts = calculateSubmodulePageCounts(submoduleData);

  // Find the current lesson index
  const currentLessonIndex =
    submoduleData?.lessons?.findIndex(l => l._id === lessonId) || 0;

  // Calculate pages completed before current lesson
  let pagesCompleted = pageCounts.introPages; // Start with intro pages

  // Add pages from previous lessons
  if (submoduleData?.lessons && currentLessonIndex > 0) {
    for (let i = 0; i < currentLessonIndex; i++) {
      const lesson = submoduleData.lessons[i];
      pagesCompleted += lesson.pages?.length || 0;
      pagesCompleted += lesson.activity_pages?.length || 0;
      pagesCompleted +=
        lesson.quizzes?.reduce(
          (acc, quiz) => acc + (quiz.questions?.length || 0),
          0
        ) || 0;
    }
  }

  // Add current lesson progress (currentPage is already 1-indexed)
  const currentProgress = pagesCompleted + currentPage;

  return {
    currentPage: currentProgress,
    totalPages: pageCounts.totalPages,
    progressPercentage:
      pageCounts.totalPages > 0
        ? (currentProgress / pageCounts.totalPages) * 100
        : 0,
  };
}

/**
 * Calculate current progress for activity pages
 */
export function calculateActivityProgress(
  submoduleData: SanitySubmoduleWithLessons | null,
  lessonId: string,
  currentPage: number
): CurrentProgress {
  const pageCounts = calculateSubmodulePageCounts(submoduleData);

  // Find the current lesson index
  const currentLessonIndex =
    submoduleData?.lessons?.findIndex(l => l._id === lessonId) || 0;

  // Calculate pages completed before current lesson activities
  let pagesCompleted = pageCounts.introPages; // Start with intro pages

  // Add pages from previous lessons
  if (submoduleData?.lessons && currentLessonIndex >= 0) {
    for (let i = 0; i <= currentLessonIndex; i++) {
      const lesson = submoduleData.lessons[i];
      if (i < currentLessonIndex) {
        // Previous lessons - add all pages
        pagesCompleted += lesson.pages?.length || 0;
        pagesCompleted += lesson.activity_pages?.length || 0;
        pagesCompleted +=
          lesson.quizzes?.reduce(
            (acc, quiz) => acc + (quiz.questions?.length || 0),
            0
          ) || 0;
      } else {
        // Current lesson - add lesson pages, then activity pages
        pagesCompleted += lesson.pages?.length || 0;
        pagesCompleted += currentPage; // Current activity page (1-indexed)
      }
    }
  }

  return {
    currentPage: pagesCompleted,
    totalPages: pageCounts.totalPages,
    progressPercentage:
      pageCounts.totalPages > 0
        ? (pagesCompleted / pageCounts.totalPages) * 100
        : 0,
  };
}

/**
 * Calculate current progress for quiz pages
 */
export function calculateQuizProgress(
  submoduleData: SanitySubmoduleWithLessons | null,
  lessonId: string,
  quizId: string,
  currentQuestion: number
): CurrentProgress {
  const pageCounts = calculateSubmodulePageCounts(submoduleData);

  // Find the current lesson index
  const currentLessonIndex =
    submoduleData?.lessons?.findIndex(l => l._id === lessonId) || 0;

  // Calculate pages completed before current quiz
  let pagesCompleted = pageCounts.introPages; // Start with intro pages

  // Add pages from previous lessons
  if (submoduleData?.lessons && currentLessonIndex >= 0) {
    for (let i = 0; i <= currentLessonIndex; i++) {
      const lesson = submoduleData.lessons[i];
      if (i < currentLessonIndex) {
        // Previous lessons - add all pages
        pagesCompleted += lesson.pages?.length || 0;
        pagesCompleted += lesson.activity_pages?.length || 0;
        pagesCompleted +=
          lesson.quizzes?.reduce(
            (acc, quiz) => acc + (quiz.questions?.length || 0),
            0
          ) || 0;
      } else {
        // Current lesson - add lesson pages and activity pages
        pagesCompleted += lesson.pages?.length || 0;
        pagesCompleted += lesson.activity_pages?.length || 0;

        // Add quiz pages from current lesson up to current quiz
        if (lesson.quizzes) {
          const currentQuizIndex = lesson.quizzes.findIndex(
            q => q._id === quizId
          );
          for (let j = 0; j <= currentQuizIndex; j++) {
            const quiz = lesson.quizzes[j];
            if (j < currentQuizIndex) {
              // Previous quizzes in current lesson
              pagesCompleted += quiz.questions?.length || 0;
            } else {
              // Current quiz (currentQuestion is already 1-indexed)
              pagesCompleted += currentQuestion;
            }
          }
        }
      }
    }
  }

  return {
    currentPage: pagesCompleted,
    totalPages: pageCounts.totalPages,
    progressPercentage:
      pageCounts.totalPages > 0
        ? (pagesCompleted / pageCounts.totalPages) * 100
        : 0,
  };
}
