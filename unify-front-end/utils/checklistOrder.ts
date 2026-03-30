import { Priority, UserTaskWithDetails } from '@/types/checklist';

/** Canonical section order for checklist screen and persistence. */
export const CHECKLIST_PRIORITY_ORDER: Priority[] = [
  'Do now',
  'Do soon',
  'Explore and connect',
  'Optional / later',
];

export function normalizeChecklistPriority(p: Priority): Priority {
  return p === 'Explore & connect' ? 'Explore and connect' : p;
}

/** Stable id for ordering: matches Supabase `ordered_keys` entries. */
export function getChecklistTaskOrderKey(task: UserTaskWithDetails): string {
  if (task.source === 'custom' && task.custom_task_id != null) {
    return `custom:${task.custom_task_id}`;
  }
  if (task.sanity_checklist_id) {
    return `sanity:${task.sanity_checklist_id}`;
  }
  return `user_task:${task.user_task_id}`;
}

export function applyOrderWithinPriority(
  tasks: UserTaskWithDetails[],
  savedOrder: string[] | null | undefined
): UserTaskWithDetails[] {
  if (!savedOrder?.length) {
    return tasks;
  }
  const map = new Map(
    tasks.map(t => [getChecklistTaskOrderKey(t), t] as const)
  );
  const out: UserTaskWithDetails[] = [];
  const seen = new Set<string>();

  for (const k of savedOrder) {
    const t = map.get(k);
    if (t) {
      out.push(t);
      seen.add(k);
    }
  }
  for (const t of tasks) {
    const k = getChecklistTaskOrderKey(t);
    if (!seen.has(k)) {
      out.push(t);
    }
  }
  return out;
}

function groupTasksByPriority(
  tasks: UserTaskWithDetails[]
): Map<Priority, UserTaskWithDetails[]> {
  const map = new Map<Priority, UserTaskWithDetails[]>();
  for (const p of CHECKLIST_PRIORITY_ORDER) {
    map.set(p, []);
  }
  for (const t of tasks) {
    const p = normalizeChecklistPriority(t.task.priority);
    if (!map.has(p)) {
      map.set(p, []);
    }
    map.get(p)!.push(t);
  }
  return map;
}

export function applySavedOrderToTasks(
  tasks: UserTaskWithDetails[],
  orders: Partial<Record<Priority, string[]>>
): UserTaskWithDetails[] {
  const byP = groupTasksByPriority(tasks);
  return CHECKLIST_PRIORITY_ORDER.flatMap(p =>
    applyOrderWithinPriority(byP.get(p) ?? [], orders[p])
  );
}

export function replacePriorityBucket(
  all: UserTaskWithDetails[],
  priority: Priority,
  newBucket: UserTaskWithDetails[]
): UserTaskWithDetails[] {
  const pNorm = normalizeChecklistPriority(priority);
  const byP = groupTasksByPriority(all);
  byP.set(pNorm, newBucket);
  return CHECKLIST_PRIORITY_ORDER.flatMap(p => byP.get(p) ?? []);
}
