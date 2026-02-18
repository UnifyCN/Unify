import { supabase } from '@/lib/supabase';
import { CustomChecklistTask, CustomPriority } from '@/types/checklist';

interface CreateCustomChecklistTaskInput {
  userId: string;
  priority: CustomPriority;
  title: string;
  description?: string;
}

interface SetCustomChecklistTaskCompletionInput {
  userId: string;
  customTaskId: number;
  completed: boolean;
}

interface DeleteCustomChecklistTaskInput {
  userId: string;
  customTaskId: number;
}

export async function getCustomChecklistTasks(
  userId: string
): Promise<CustomChecklistTask[]> {
  const { data, error } = await supabase
    .from('custom_checklist_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch custom checklist tasks: ${error.message}`);
  }

  return (data ?? []) as CustomChecklistTask[];
}

export async function createCustomChecklistTask({
  userId,
  priority,
  title,
  description = '',
}: CreateCustomChecklistTaskInput): Promise<CustomChecklistTask> {
  const { data, error } = await supabase
    .from('custom_checklist_tasks')
    .insert({
      user_id: userId,
      priority,
      title: title.trim(),
      description: description.trim(),
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create custom checklist task: ${error?.message}`
    );
  }

  return data as CustomChecklistTask;
}

export async function setCustomChecklistTaskCompletion({
  userId,
  customTaskId,
  completed,
}: SetCustomChecklistTaskCompletionInput): Promise<void> {
  const { error } = await supabase
    .from('custom_checklist_tasks')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', customTaskId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to update custom checklist task: ${error.message}`);
  }
}

export async function deleteCustomChecklistTask({
  userId,
  customTaskId,
}: DeleteCustomChecklistTaskInput): Promise<void> {
  const { error } = await supabase
    .from('custom_checklist_tasks')
    .delete()
    .eq('id', customTaskId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete custom checklist task: ${error.message}`);
  }
}
