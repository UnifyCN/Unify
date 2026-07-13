import { supabase } from '@/lib/supabase';

export type LessonCommentRow = {
  id: number;
  lesson_id: string;
  module_id: string;
  submodule_id: string;
  page_num: number;
  user_id: string;
  content: string;
  created_at: string;
  users?: {
    username: string;
    profile_picture_url: string | null;
  } | null;
};

export const getLessonComments = async ({
  lessonId,
  pageNum,
}: {
  lessonId: string;
  pageNum: number;
}): Promise<LessonCommentRow[]> => {
  const { data, error } = await supabase
    .from('lesson_comments')
    .select(
      `
        id,
        lesson_id,
        module_id,
        submodule_id,
        page_num,
        user_id,
        content,
        created_at,
        users!user_id(username, profile_picture_url)
      `
    )
    .eq('lesson_id', lessonId)
    .eq('page_num', pageNum)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as LessonCommentRow[];
};

export const createLessonComment = async ({
  lessonId,
  moduleId,
  submoduleId,
  pageNum,
  content,
}: {
  lessonId: string;
  moduleId: string;
  submoduleId: string;
  pageNum: number;
  content: string;
}) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('lesson_comments')
    .insert({
      lesson_id: lessonId,
      module_id: moduleId,
      submodule_id: submoduleId,
      page_num: pageNum,
      user_id: user.id,
      content,
    })
    .select(
      `
        id,
        lesson_id,
        module_id,
        submodule_id,
        page_num,
        user_id,
        content,
        created_at,
        users!user_id(username, profile_picture_url)
      `
    )
    .single();

  if (error) throw new Error(error.message);
  return data as LessonCommentRow;
};