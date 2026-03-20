import { useQuery } from '@tanstack/react-query';
import { fetchSavedLessonPages } from '@/services/learn/lessonPageSaves';

export const SAVED_LESSON_PAGES_KEY = ['savedLessonPages'] as const;

export function useSavedLessonPages() {
  return useQuery({
    queryKey: SAVED_LESSON_PAGES_KEY,
    queryFn: fetchSavedLessonPages,
  });
}
