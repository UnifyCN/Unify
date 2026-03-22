import { useQuery } from '@tanstack/react-query';
import { isLessonPageSaved } from '@/services/learn/lessonPageSaves';

export function lessonPageSaveQueryKey(lessonId: string, pageNumber: number) {
  return ['lessonPageSaved', lessonId, pageNumber] as const;
}

export function useLessonPageSaved(lessonId: string | undefined, pageNumber: number) {
  return useQuery({
    queryKey: lessonPageSaveQueryKey(lessonId || '', pageNumber),
    queryFn: () => isLessonPageSaved(lessonId!, pageNumber),
    enabled: !!lessonId && pageNumber >= 1,
  });
}
