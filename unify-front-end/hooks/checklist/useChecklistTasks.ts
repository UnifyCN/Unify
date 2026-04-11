import type { SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { UserTaskWithDetails } from '@/types/checklist';
import { getChecklistWithUserProgress } from '@/services/checklist/getChecklistWithUserProgress';
import { getChecklistTaskOrders } from '@/services/checklist/checklistTaskOrder';
import { applySavedOrderToTasks } from '@/utils/checklistOrder';
import {
  buildChecklistCacheStorageKey,
  getChecklistMemoryCache,
  loadChecklistFromDisk,
  saveChecklistToDisk,
  setChecklistMemoryCache,
} from '@/utils/checklistTaskCache';
import {
  checklistTasksQueryKey,
  CHECKLIST_TASKS_QUERY_ROOT,
} from '@/hooks/checklist/checklistQueryKeys';
import {
  stageNumberToStageSlug,
  normalizePersonaSlug,
} from '@/helpers/dateHelpers';

interface UseChecklistTasksParams {
  currentStage: number | null;
  stageChanged: boolean;
  persona: string | null;
}

async function fetchChecklistTasks(
  userId: string,
  currentStage: number,
  normalizedPersona: string,
  stageChanged: boolean
): Promise<UserTaskWithDetails[]> {
  const stageSlug = stageNumberToStageSlug(currentStage);
  const merged = await getChecklistWithUserProgress(
    userId,
    normalizedPersona,
    stageSlug,
    { stageChanged }
  );
  try {
    const orders = await getChecklistTaskOrders(userId);
    return applySavedOrderToTasks(merged, orders);
  } catch (orderErr) {
    console.error('Error loading checklist order:', orderErr);
    return merged;
  }
}

export const useChecklistTasks = ({
  currentStage,
  stageChanged,
  persona,
}: UseChecklistTasksParams) => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [cacheChecked, setCacheChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) {
        setUserId(data.user?.id ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedPersona = useMemo(
    () => normalizePersonaSlug(persona),
    [persona]
  );

  const queryKey = useMemo(() => {
    if (
      !userId ||
      currentStage === null ||
      !normalizedPersona ||
      normalizedPersona === ''
    ) {
      return null;
    }
    return checklistTasksQueryKey(
      userId,
      currentStage,
      normalizedPersona,
      stageChanged
    );
  }, [userId, currentStage, normalizedPersona, stageChanged]);

  const storageKey = useMemo(() => {
    if (!queryKey) {
      return null;
    }
    return buildChecklistCacheStorageKey(
      userId!,
      currentStage!,
      normalizedPersona!,
      stageChanged
    );
  }, [queryKey, userId, currentStage, normalizedPersona, stageChanged]);

  // Hydrate React Query from memory (sync) then AsyncStorage before network fetch.
  useEffect(() => {
    if (!queryKey || !storageKey || !userId) {
      setCacheChecked(true);
      return;
    }

    setCacheChecked(false);

    const mem = getChecklistMemoryCache(storageKey);
    if (mem) {
      queryClient.setQueryData(queryKey, mem);
      setCacheChecked(true);
      return;
    }

    let cancelled = false;
    (async () => {
      const disk = await loadChecklistFromDisk(storageKey);
      if (cancelled) {
        return;
      }
      if (disk !== null) {
        queryClient.setQueryData(queryKey, disk);
        setChecklistMemoryCache(storageKey, disk);
      }
      setCacheChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [queryClient, queryKey, storageKey, userId]);

  const query = useQuery({
    queryKey: queryKey ?? [CHECKLIST_TASKS_QUERY_ROOT, 'disabled'],
    queryFn: () =>
      fetchChecklistTasks(
        userId!,
        currentStage!,
        normalizedPersona!,
        stageChanged
      ),
    enabled:
      cacheChecked &&
      !!queryKey &&
      !!userId &&
      currentStage !== null &&
      !!normalizedPersona,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });

  useEffect(() => {
    if (!query.data || !storageKey) {
      return;
    }
    setChecklistMemoryCache(storageKey, query.data);
    void saveChecklistToDisk(storageKey, query.data);
  }, [query.data, storageKey]);

  const setTasks = useCallback(
    (updater: SetStateAction<UserTaskWithDetails[]>) => {
      if (!queryKey) {
        return;
      }
      queryClient.setQueryData(
        queryKey,
        (old: UserTaskWithDetails[] | undefined) => {
          const prev = old ?? [];
          return typeof updater === 'function'
            ? (updater as (p: UserTaskWithDetails[]) => UserTaskWithDetails[])(
                prev
              )
            : updater;
        }
      );
      const next = queryClient.getQueryData(queryKey) as
        | UserTaskWithDetails[]
        | undefined;
      if (next && storageKey) {
        setChecklistMemoryCache(storageKey, next);
        void saveChecklistToDisk(storageKey, next);
      }
    },
    [queryClient, queryKey, storageKey]
  );

  const refetch = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: [CHECKLIST_TASKS_QUERY_ROOT],
    });
  }, [queryClient]);

  const tasks = query.data ?? [];

  const waitingForAuth =
    Boolean(persona && currentStage !== null && userId === null);

  const isLoading =
    waitingForAuth ||
    Boolean(
      queryKey &&
        normalizedPersona &&
        currentStage !== null &&
        (!cacheChecked || (query.isPending && query.data === undefined))
    );

  return {
    tasks,
    isLoading,
    error: query.error ? String(query.error) : null,
    refetch,
    setTasks,
  };
};
