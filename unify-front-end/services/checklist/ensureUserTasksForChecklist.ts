import { supabase } from '@/lib/supabase';
import { SanityChecklistItem, UserTaskWithDetails } from '@/types/checklist';

/**
 * Insert user_tasks rows for any Sanity checklist items that don't have one yet.
 * Returns the set of sanity_checklist_id that were inserted.
 */
export async function ensureUserTasksForChecklist(
  userId: string,
  items: SanityChecklistItem[],
  existingRows: UserTaskWithDetails[]
): Promise<void> {
  const existingIds = new Set(
    (existingRows || [])
      .map(r => r.sanity_checklist_id)
      .filter((id): id is string => !!id)
  );
  const toInsert = items.filter(item => !existingIds.has(item._id));
  if (toInsert.length === 0) return;

  const rows = toInsert.map(item => ({
    user_id: userId,
    task_id: null,
    sanity_checklist_id: item._id,
    completed: false,
  }));

  const { error } = await supabase.from('user_tasks').insert(rows);
  if (error) {
    console.error('ensureUserTasksForChecklist - Insert error:', error);
  }
}
 