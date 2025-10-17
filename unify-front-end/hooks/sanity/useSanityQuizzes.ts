import { useQuery } from '@tanstack/react-query';
import { getLessonQuizzes, getQuiz, getQuizQuestions } from '../../services/sanity/quizzes';

export function useSanityLessonQuizzes(lessonId: string) {
  return useQuery({
    queryKey: ['sanity', 'lessonQuizzes', lessonId],
    queryFn: () => getLessonQuizzes(lessonId),
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useSanityQuiz(quizId: string) {
  return useQuery({
    queryKey: ['sanity', 'quiz', quizId],
    queryFn: () => getQuiz(quizId),
    enabled: !!quizId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useSanityQuizQuestions(quizId: string) {
  return useQuery({
    queryKey: ['sanity', 'quizQuestions', quizId],
    queryFn: () => getQuizQuestions(quizId),
    enabled: !!quizId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

