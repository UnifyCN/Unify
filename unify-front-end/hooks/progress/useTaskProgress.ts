import { useCallback } from 'react';
import {
  getTaskProgress,
  startTask,
  completeTask,
  getTaskProgressBySubmodule,
  updateTaskLastAccessed,
} from '@/services/progress/taskProgressService';
import { UserTaskProgress } from '@/types/progress';

export function useTaskProgress() {
  const fetchProgress = useCallback(
    (taskId: string): Promise<UserTaskProgress | null> =>
      getTaskProgress(taskId),
    []
  );

  const fetchProgressBySubmodule = useCallback(
    (submoduleId: string): Promise<UserTaskProgress[]> =>
      getTaskProgressBySubmodule(submoduleId),
    []
  );

  const start = useCallback(
    async (taskId: string, submoduleId: string, moduleId: string) => {
      await startTask(taskId, submoduleId, moduleId);
    },
    []
  );

  const complete = useCallback(async (taskId: string) => {
    await completeTask(taskId);
  }, []);

  const updateLastAccessed = useCallback(async (taskId: string) => {
    await updateTaskLastAccessed(taskId);
  }, []);

  return {
    getTaskProgress: fetchProgress,
    getTaskProgressBySubmodule: fetchProgressBySubmodule,
    startTask: start,
    completeTask: complete,
    updateTaskLastAccessed: updateLastAccessed,
  };
}
