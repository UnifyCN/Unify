import { QueryClient } from '@tanstack/react-query';

/** Prefix for all checklist task list queries (persona + stage + user). */
export const CHECKLIST_TASKS_QUERY_ROOT = 'checklist' as const;

export function checklistTasksQueryKey(
  userId: string,
  stage: number,
  personaSlug: string,
  stageChanged: boolean
) {
  return [
    CHECKLIST_TASKS_QUERY_ROOT,
    userId,
    stage,
    personaSlug,
    stageChanged,
  ] as const;
}

export function invalidateChecklistTasksQueries(
  queryClient: QueryClient
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: [CHECKLIST_TASKS_QUERY_ROOT],
  });
}
