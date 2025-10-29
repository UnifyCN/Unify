import { useState, useEffect, useCallback } from 'react';
import {
  getSubmoduleProgress,
  startSubmodule,
  completeSubmodule,
} from '@/services/progress/progressService';
import { UserSubmoduleProgress } from '@/types/progress';

interface UseSubmoduleProgressReturn {
  submoduleProgress: UserSubmoduleProgress | null;
  isLoading: boolean;
  error: string | null;
  startSubmodule: (submoduleId: string, moduleId: string) => Promise<void>;
  completeSubmodule: () => Promise<void>;
  refreshProgress: () => Promise<void>;
}

export function useSubmoduleProgress(
  submoduleId: string,
  moduleId: string
): UseSubmoduleProgressReturn {
  const [submoduleProgress, setSubmoduleProgress] =
    useState<UserSubmoduleProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const progress = await getSubmoduleProgress(submoduleId);
      setSubmoduleProgress(progress);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch submodule progress'
      );
    } finally {
      setIsLoading(false);
    }
  }, [submoduleId]);

  const handleStartSubmodule = useCallback(
    async (submoduleId: string, moduleId: string) => {
      try {
        await startSubmodule(submoduleId, moduleId);
        await fetchProgress();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to start submodule'
        );
      }
    },
    [fetchProgress]
  );

  const handleCompleteSubmodule = useCallback(async () => {
    try {
      await completeSubmodule(submoduleId);
      await fetchProgress();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to complete submodule'
      );
    }
  }, [submoduleId, fetchProgress]);

  const refreshProgress = useCallback(async () => {
    await fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    if (submoduleId) {
      fetchProgress();
    }
  }, [submoduleId, fetchProgress]);

  return {
    submoduleProgress,
    isLoading,
    error,
    startSubmodule: handleStartSubmodule,
    completeSubmodule: handleCompleteSubmodule,
    refreshProgress,
  };
}
