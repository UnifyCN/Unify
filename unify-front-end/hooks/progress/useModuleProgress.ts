import { useState, useEffect, useCallback } from 'react';
import { 
  getModuleProgress, 
  startModule, 
  completeModule
} from '@/services/progress/progressService';
import { UserModuleProgress } from '@/types/progress';

interface UseModuleProgressReturn {
  moduleProgress: UserModuleProgress | null;
  isLoading: boolean;
  error: string | null;
  startModule: (moduleId: string) => Promise<void>;
  completeModule: () => Promise<void>;
  refreshProgress: () => Promise<void>;
}

export function useModuleProgress(moduleId: string): UseModuleProgressReturn {
  const [moduleProgress, setModuleProgress] = useState<UserModuleProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const progress = await getModuleProgress(moduleId);
      setModuleProgress(progress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch module progress');
    } finally {
      setIsLoading(false);
    }
  }, [moduleId]);

  const handleStartModule = useCallback(async (moduleId: string) => {
    try {
      await startModule(moduleId);
      await fetchProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start module');
    }
  }, [fetchProgress]);

  const handleCompleteModule = useCallback(async () => {
    try {
      await completeModule(moduleId);
      await fetchProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete module');
    }
  }, [moduleId, fetchProgress]);

  const refreshProgress = useCallback(async () => {
    await fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    if (moduleId) {
      fetchProgress();
    }
  }, [moduleId, fetchProgress]);

  return {
    moduleProgress,
    isLoading,
    error,
    startModule: handleStartModule,
    completeModule: handleCompleteModule,
    refreshProgress,
  };
}


