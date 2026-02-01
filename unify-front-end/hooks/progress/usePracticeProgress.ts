import { useCallback } from 'react';
import {
  getPracticeProgress,
  startPractice,
  updatePracticeProgress,
  completePractice,
  getPracticeProgressBySubmodule,
} from '@/services/progress/practiceProgressService';
import { UserPracticeProgress } from '@/types/progress';

export function usePracticeProgress() {
  const fetchProgress = useCallback(
    (practiceId: string): Promise<UserPracticeProgress | null> =>
      getPracticeProgress(practiceId),
    []
  );

  const fetchProgressBySubmodule = useCallback(
    (submoduleId: string): Promise<UserPracticeProgress[]> =>
      getPracticeProgressBySubmodule(submoduleId),
    []
  );

  const start = useCallback(
    async (
      practiceId: string,
      submoduleId: string,
      moduleId: string,
      practiceType: 'quiz' | 'activity'
    ) => {
      await startPractice(practiceId, submoduleId, moduleId, practiceType);
    },
    []
  );

  const updatePage = useCallback(
    async (practiceId: string, currentPageNumber: number) => {
      await updatePracticeProgress(practiceId, currentPageNumber);
    },
    []
  );

  const complete = useCallback(async (practiceId: string) => {
    await completePractice(practiceId);
  }, []);

  return {
    getPracticeProgress: fetchProgress,
    getPracticeProgressBySubmodule: fetchProgressBySubmodule,
    startPractice: start,
    updatePracticeProgress: updatePage,
    completePractice: complete,
  };
}
