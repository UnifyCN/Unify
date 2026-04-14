import { progressClient } from '@/services/progress/progressClient';
import type { ModuleProgressStatus } from '@/types/learn';

/**
 * Upsert a row in `learn_progress` for the given module.
 * Safe to call fire-and-forget — errors are swallowed to never interrupt the UI.
 */
export async function upsertModuleProgress(
  moduleId: string,
  status: ModuleProgressStatus
): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    // Don't downgrade a completed module
    const { data: existing } = await progressClient
      .from('learn_progress')
      .select('status')
      .eq('user_id', user.id)
      .eq('module_id', moduleId)
      .maybeSingle();

    if (existing?.status === 'completed' && status !== 'completed') return;

    const patch: Record<string, unknown> = {
      user_id: user.id,
      module_id: moduleId,
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    };

    const { error } = await progressClient
      .from('learn_progress')
      .upsert(patch, { onConflict: 'user_id,module_id' });

    if (error) {
      console.error('[moduleProgressService] upsert error', error);
    }
  } catch (err) {
    console.error('[moduleProgressService] unexpected error', err);
  }
}

/**
 * Fetch the current status for a single module.
 * Returns `not_started` when no row exists.
 */
export async function getModuleProgressStatus(
  moduleId: string
): Promise<ModuleProgressStatus> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return 'not_started';

    const { data, error } = await progressClient
      .from('learn_progress')
      .select('status')
      .eq('user_id', user.id)
      .eq('module_id', moduleId)
      .maybeSingle();

    if (error) {
      console.error('[moduleProgressService] fetch error', error);
      return 'not_started';
    }

    return (data?.status as ModuleProgressStatus) ?? 'not_started';
  } catch {
    return 'not_started';
  }
}
