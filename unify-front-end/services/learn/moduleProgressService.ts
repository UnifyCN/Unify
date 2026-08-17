import { progressClient } from '@/services/progress/progressClient';
import { sanityClient } from '@/sanity-custom';
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

/**
 * Cross-checks whether every lesson in a module is now completed in
 * `user_lesson_progress`; if so, marks the module as `completed` in
 * `learn_progress`. Fire-and-forget from lesson-completion write paths — the
 * lesson-level table is the source of truth for "finished all content", while
 * `learn_progress` is the source of truth for module-level UI state. They're
 * separate tables, so nothing flips a module to "completed" unless we do it
 * explicitly here.
 *
 * All errors are swallowed; a failure here must never block lesson completion.
 */
export async function maybeMarkModuleCompleted(
  moduleId: string
): Promise<void> {
  try {
    const {
      data: { user },
    } = await progressClient.auth.getUser();
    if (!user) return;

    // Skip if already marked completed — upsertModuleProgress already guards
    // against downgrade, but avoiding the Sanity round-trip is cheaper.
    const { data: existing } = await progressClient
      .from('learn_progress')
      .select('status')
      .eq('user_id', user.id)
      .eq('module_id', moduleId)
      .maybeSingle();
    if (existing?.status === 'completed') return;

    // Fetch every lesson _id under this module via Sanity. `references()` walks
    // the module → submodule → lesson graph implicitly by nesting.
    const query = `*[_type == "module" && _id == $moduleId && (language == "en" || !defined(language))][0] {
      "lessonIds": *[_type == "submodule" && references(^._id) && (language == "en" || !defined(language))][] {
        "ids": *[_type == "lesson" && references(^._id) && (language == "en" || !defined(language))]._id
      }.ids[]
    }`;
    const result = await sanityClient.fetch(query, { moduleId });
    const lessonIds: string[] = Array.isArray(result?.lessonIds)
      ? (result.lessonIds as string[]).filter(
          (id): id is string => typeof id === 'string'
        )
      : [];

    if (lessonIds.length === 0) return;

    // Count this user's completed lessons within that set.
    const { data: completedRows, error } = await progressClient
      .from('user_lesson_progress')
      .select('sanity_lesson_id')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .in('sanity_lesson_id', lessonIds);

    if (error) {
      console.error('[moduleProgressService] completion check error', error);
      return;
    }

    const completedCount = new Set(
      (completedRows ?? []).map(r => r.sanity_lesson_id)
    ).size;

    if (completedCount >= lessonIds.length) {
      await upsertModuleProgress(moduleId, 'completed');
    }
  } catch (err) {
    console.error(
      '[moduleProgressService] maybeMarkModuleCompleted error',
      err
    );
  }
}
