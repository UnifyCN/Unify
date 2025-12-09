import { useQuery } from '@tanstack/react-query';
import { getLesson } from '../../services/sanity/lessons';

export function useSanityLesson(lessonId: string) {
  return useQuery({
    queryKey: ['sanity', 'lesson', lessonId],
    queryFn: () => getLesson(lessonId),
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
