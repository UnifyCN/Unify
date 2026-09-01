import { QueryClient } from '@tanstack/react-query';
import type { SanityLanguage } from '@/services/sanity/i18n';

/** Prefix for all checklist task list queries (persona + stage + user). */
export const CHECKLIST_TASKS_QUERY_ROOT = 'checklist' as const;

export function checklistTasksQueryKey(
  userId: string,
  stage: number,
  personaSlug: string,
  stageChanged: boolean,
  language: SanityLanguage
) {
  return [
    CHECKLIST_TASKS_QUERY_ROOT,
    userId,
    stage,
    personaSlug,
    stageChanged,
    language,
  ] as const;
}

export function invalidateChecklistTasksQueries(
  queryClient: QueryClient
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: [CHECKLIST_TASKS_QUERY_ROOT],
  });
}
