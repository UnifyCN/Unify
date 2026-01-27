import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserTaskWithDetails, Stage } from '@/types/checklist';
import { getUserTasks } from '@/services/checklist/getUserTasks';
import { getPersonalizedTasks } from '@/services/checklist/getPersonalizedTasks';
import { createUserTasks } from '@/services/checklist/createUserTasks';
import { deleteUserTasks } from '@/services/checklist/deleteUserTasks';
import { stageNumberToEnum } from '@/helpers/dateHelpers';

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

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

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

        if (currentStage === null || !persona) {
          setTasks([]);
          return;
        }

        // Fetch existing user tasks
        const existingTasks = await getUserTasks(user.id);

        // If stage has changed or no tasks exist, regenerate tasks
        if (stageChanged || existingTasks.length === 0) {
          // Delete existing tasks if any
          if (existingTasks.length > 0) {
            await deleteUserTasks(user.id);
          }

          // Fetch personalized tasks for the user's persona and stage
          const personalizedTasks = await getPersonalizedTasks(
            persona,
            currentStage
          );

          // Create new user tasks
          if (personalizedTasks.length > 0) {
            await createUserTasks(user.id, personalizedTasks);

            // Fetch the newly created tasks with details
            const newUserTasks = await getUserTasks(user.id);
            setTasks(newUserTasks);
          } else {
            setTasks([]);
          }
        } else {
          // Use existing tasks
          setTasks(existingTasks);
        }
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
