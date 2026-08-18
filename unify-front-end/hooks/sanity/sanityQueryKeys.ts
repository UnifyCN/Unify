import type { SanityLanguage } from '@/services/sanity/i18n';

export const sanityQueryKeys = {
  modules: (language: SanityLanguage) =>
    ['sanity', 'modules', language] as const,
  module: (moduleId: string, language: SanityLanguage) =>
    ['sanity', 'module', moduleId, language] as const,
  moduleWithSubmodules: (moduleId: string, language: SanityLanguage) =>
    ['sanity', 'moduleWithSubmodules', moduleId, language] as const,
  submoduleWithLessons: (submoduleId: string, language: SanityLanguage) =>
    ['sanity', 'submoduleWithLessons', submoduleId, language] as const,
  lesson: (lessonId: string, language: SanityLanguage) =>
    ['sanity', 'lesson', lessonId, language] as const,
  practices: (submoduleId: string, language: SanityLanguage) =>
    ['sanity', 'practices', submoduleId, language] as const,
  practice: (practiceId: string, language: SanityLanguage) =>
    ['sanity', 'practice', practiceId, language] as const,
  lessonQuizzes: (lessonId: string, language: SanityLanguage) =>
    ['sanity', 'lessonQuizzes', lessonId, language] as const,
  quizQuestions: (quizId: string, language: SanityLanguage) =>
    ['sanity', 'quizQuestions', quizId, language] as const,
  tasks: (submoduleId: string, language: SanityLanguage) =>
    ['sanity', 'tasks', submoduleId, language] as const,
  task: (taskId: string, language: SanityLanguage) =>
    ['sanity', 'task', taskId, language] as const,
};
