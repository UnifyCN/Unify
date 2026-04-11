import { supabase } from '@/lib/supabase';
import { Priority } from '@/types/checklist';

export async function getChecklistTaskOrders(
  userId: string
): Promise<Partial<Record<Priority, string[]>>> {
  const { data, error } = await supabase
    .from('checklist_task_order')
    .select('priority, ordered_keys')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  const out: Partial<Record<Priority, string[]>> = {};
  for (const row of data ?? []) {
    const p = row.priority as Priority;
    out[p] = (row.ordered_keys as string[] | null) ?? [];
  }
  return out;
}

export async function upsertChecklistTaskOrder(
  userId: string,
  priority: Priority,
  orderedKeys: string[]
): Promise<void> {
  const { error } = await supabase.from('checklist_task_order').upsert(
    {
      user_id: userId,
      priority,
      ordered_keys: orderedKeys,
    },
    { onConflict: 'user_id,priority' }
  );

  if (error) {
    throw error;
  }
}
