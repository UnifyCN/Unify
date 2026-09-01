import { useQuery } from '@tanstack/react-query';
import {
  getLessonQuizzes,
  getQuizQuestions,
} from '../../services/sanity/quizzes';
import { sanityQueryKeys } from './sanityQueryKeys';
import { useSanityLanguage } from './useSanityLanguage';

export function useSanityLessonQuizzes(lessonId: string) {
  const language = useSanityLanguage();
  return useQuery({
    queryKey: sanityQueryKeys.lessonQuizzes(lessonId, language),
    queryFn: () => getLessonQuizzes(lessonId, language),
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useSanityQuizQuestions(quizId: string) {
  const language = useSanityLanguage();
  return useQuery({
    queryKey: sanityQueryKeys.quizQuestions(quizId, language),
    queryFn: () => getQuizQuestions(quizId, language),
    enabled: !!quizId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
