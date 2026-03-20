import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import { cachedProgressService } from '@/services/progress/cachedProgressService';

let hasScheduledProgressWarmup = false;

export function useProgressCache() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hasScheduledProgressWarmup) {
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }

    hasScheduledProgressWarmup = true;
    let isCancelled = false;

    const initializeCache = async () => {
      try {
        setIsLoading(true);
        await cachedProgressService.getProgressData();
        if (!isCancelled) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing progress cache:', error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    const task = InteractionManager.runAfterInteractions(() => {
      void initializeCache();
    });

    return () => {
      isCancelled = true;
      task.cancel();
    };
  }, []);

  return {
    isInitialized,
    isLoading,
  };
}
