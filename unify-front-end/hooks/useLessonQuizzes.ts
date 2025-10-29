import { useQuery } from '@tanstack/react-query';
import { getLessonQuizzes } from '../services/learn/getLessonQuizzes';
import { Quiz } from '../types/learn';

export const useLessonQuizzes = (lessonId: string) => {
  return useQuery<Quiz[]>({
    queryKey: ['lessonQuizzes', lessonId],
    queryFn: () => getLessonQuizzes(lessonId),
    enabled: !!lessonId,
  });
};
