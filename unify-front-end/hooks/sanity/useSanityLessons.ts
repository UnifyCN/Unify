import { useQuery } from '@tanstack/react-query';
import { getLesson } from '../../services/sanity/lessons';
import { sanityQueryKeys } from './sanityQueryKeys';
import { useSanityLanguage } from './useSanityLanguage';

export function useSanityLesson(lessonId: string) {
  const language = useSanityLanguage();
  return useQuery({
    queryKey: sanityQueryKeys.lesson(lessonId, language),
    queryFn: () => getLesson(lessonId, language),
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
