import { supabase } from '@/lib/supabase';

export interface SavedLessonPageRow {
  id: string;
  lessonId: string;
  pageNumber: number;
  moduleId: string;
  submoduleId: string;
  lessonTitleSnapshot: string | null;
  pageTitleSnapshot: string | null;
  createdAt: string;
}

export interface SaveLessonPageInput {
  lessonId: string;
  pageNumber: number;
  moduleId: string;
  submoduleId: string;
  lessonTitleSnapshot: string | null;
  pageTitleSnapshot: string | null;
}

export async function fetchSavedLessonPages(): Promise<SavedLessonPageRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('lesson_page_saves')
    .select(
      'id, lesson_id, page_number, module_id, submodule_id, lesson_title_snapshot, page_title_snapshot, created_at'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map(row => ({
    id: row.id,
    lessonId: row.lesson_id,
    pageNumber: row.page_number,
    moduleId: row.module_id,
    submoduleId: row.submodule_id,
    lessonTitleSnapshot: row.lesson_title_snapshot,
    pageTitleSnapshot: row.page_title_snapshot,
    createdAt: row.created_at,
  }));
}

export async function isLessonPageSaved(
  lessonId: string,
  pageNumber: number
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('lesson_page_saves')
    .select('id')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .eq('page_number', pageNumber)
    .maybeSingle();

  if (error) {
    console.error('isLessonPageSaved', error);
    return false;
  }
  return !!data;
}

export async function saveLessonPage(
  input: SaveLessonPageInput
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase.from('lesson_page_saves').insert({
    user_id: user.id,
    lesson_id: input.lessonId,
    page_number: input.pageNumber,
    module_id: input.moduleId,
    submodule_id: input.submoduleId,
    lesson_title_snapshot: input.lessonTitleSnapshot,
    page_title_snapshot: input.pageTitleSnapshot,
  });

  if (error) throw new Error(error.message);
}

export async function unsaveLessonPage(
  lessonId: string,
  pageNumber: number
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('lesson_page_saves')
    .delete()
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .eq('page_number', pageNumber);

  if (error) throw new Error(error.message);
}
