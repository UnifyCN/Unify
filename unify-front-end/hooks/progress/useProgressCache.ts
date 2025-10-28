import { useEffect, useState } from 'react';
import { cachedProgressService } from '@/services/progress/cachedProgressService';

export function useProgressCache() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeCache = async () => {
      try {
        console.log('Initializing progress cache...');
        setIsLoading(true);
        await cachedProgressService.getProgressData();
        setIsInitialized(true);
        console.log('Progress cache initialized successfully');
      } catch (error) {
        console.error('Error initializing progress cache:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCache();
  }, []);

  return {
    isInitialized,
    isLoading,
  };
}
