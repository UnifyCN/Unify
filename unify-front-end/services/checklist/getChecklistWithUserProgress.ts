import {
  CustomChecklistTask,
  Priority,
  SanityChecklistItem,
  UserTaskWithDetails,
  sanityChecklistItemToTaskDetails,
} from '@/types/checklist';
import {
  CHECKLIST_PRIORITY_ORDER,
  normalizeChecklistPriority,
} from '@/utils/checklistOrder';
import { getChecklistByPersonaAndStage } from '@/services/sanity/checklist';
import { getUserTasks } from './getUserTasks';
import { deleteUserTasks } from './deleteUserTasks';
import { getCustomChecklistTasks } from './customChecklistTasks';
import type { SanityLanguage } from '@/services/sanity/i18n';

function mergeChecklistWithUserTasks(
  items: SanityChecklistItem[],
  rows: UserTaskWithDetails[]
): UserTaskWithDetails[] {
  const bySanityId = new Map<string, UserTaskWithDetails>();
  rows.forEach(r => {
    if (r.sanity_checklist_id) bySanityId.set(r.sanity_checklist_id, r);
  });

  return items.map(item => {
    const row = bySanityId.get(item._id);
    return {
      user_task_id: row?.user_task_id ?? 0,
      user_id: row?.user_id ?? '',
      task_id: row?.task_id ?? null,
      custom_task_id: null,
      sanity_checklist_id: item._id,
      completed: row?.completed ?? false,
      completed_at: row?.completed_at ?? null,
      source: 'sanity',
      task: sanityChecklistItemToTaskDetails(item),
    };
  });
}

function mapCustomTasksToChecklistRows(
  rows: CustomChecklistTask[]
): UserTaskWithDetails[] {
  return rows.map(row => ({
    user_task_id: 0,
    user_id: row.user_id,
    task_id: null,
    custom_task_id: row.id,
    sanity_checklist_id: null,
    completed: row.completed,
    completed_at: row.completed_at,
    source: 'custom',
    task: {
      task_name: row.title,
      task_description: row.description,
      priority: row.priority,
    },
  }));
}

/**
 * 1. If stage changed: delete all user_tasks for this user (clean slate for new stage).
 * 2. Fetch checklist content from Sanity (persona in personas + stage slug).
 * 3. Fetch user_tasks (only rows that exist = items user has marked completed).
 * 4. Merge: display all Sanity items; completed = true only if a user_tasks row exists.
 * No pre-creating rows — we only write to user_tasks when the user marks an item complete.
 */
export async function getChecklistWithUserProgress(
  userId: string,
  persona: string,
  stageSlug: string,
  options: { stageChanged?: boolean; language?: SanityLanguage }
): Promise<UserTaskWithDetails[]> {
  if (options.stageChanged) {
    await deleteUserTasks(userId);
  }

  const items = await getChecklistByPersonaAndStage(persona, stageSlug, {
    skipCache: true,
    language: options.language,
  });

  const rows = items.length > 0 ? await getUserTasks(userId) : [];
  const sanityTasks =
    items.length > 0 ? mergeChecklistWithUserTasks(items, rows) : [];
  const customRows = await getCustomChecklistTasks(userId);
  const customTasks = mapCustomTasksToChecklistRows(customRows);

  // Interleave custom tasks into correct priority positions
  const allTasks = [...sanityTasks, ...customTasks];
  const priorityIndex = new Map(CHECKLIST_PRIORITY_ORDER.map((p, i) => [p, i]));
  allTasks.sort((a, b) => {
    const aIdx =
      priorityIndex.get(normalizeChecklistPriority(a.task.priority)) ?? 99;
    const bIdx =
      priorityIndex.get(normalizeChecklistPriority(b.task.priority)) ?? 99;
    return aIdx - bIdx;
  });

  return allTasks;
}
