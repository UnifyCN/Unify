import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserTaskWithDetails } from '@/types/checklist';
import { getChecklistWithUserProgress } from '@/services/checklist/getChecklistWithUserProgress';
import {
  stageNumberToStageSlug,
  normalizePersonaSlug,
} from '@/helpers/dateHelpers';

interface UseChecklistTasksParams {
  currentStage: number | null;
  stageChanged: boolean;
  persona: string | null;
}
 
export const useChecklistTasks = ({
  currentStage,
  stageChanged,
  persona,
}: UseChecklistTasksParams) => {
  const [tasks, setTasks] = useState<UserTaskWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchOrCreateTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        const normalizedPersona = normalizePersonaSlug(persona);
        if (currentStage === null || !normalizedPersona) {
          setTasks([]);
          return;
        }

        const stageSlug = stageNumberToStageSlug(currentStage);

        const merged = await getChecklistWithUserProgress(
          user.id,
          normalizedPersona,
          stageSlug,
          { stageChanged }
        );

        setTasks(merged);
      } catch (err) {
        console.error('Error fetching/creating checklist tasks:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrCreateTasks();
  }, [currentStage, stageChanged, persona, refetchTrigger]);

  return { tasks, isLoading, error, refetch, setTasks };
};
