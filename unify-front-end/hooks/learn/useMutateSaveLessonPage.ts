import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  saveLessonPage,
  unsaveLessonPage,
  type SaveLessonPageInput,
} from '@/services/learn/lessonPageSaves';
import { SAVED_LESSON_PAGES_KEY } from './useSavedLessonPages';
import { lessonPageSaveQueryKey } from './useLessonPageSaved';

export function useMutateSaveLessonPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      input: SaveLessonPageInput;
      isSaved: boolean;
    }) => {
      if (vars.isSaved) {
        await unsaveLessonPage(vars.input.lessonId, vars.input.pageNumber);
      } else {
        await saveLessonPage(vars.input);
      }
    },
    onSuccess: (_data, variables) => {
      const { lessonId, pageNumber } = variables.input;
      queryClient.invalidateQueries({ queryKey: SAVED_LESSON_PAGES_KEY });
      queryClient.invalidateQueries({
        queryKey: lessonPageSaveQueryKey(lessonId, pageNumber),
      });
    },
  });
}
