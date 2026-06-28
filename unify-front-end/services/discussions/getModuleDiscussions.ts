import { supabase } from '@/lib/supabase';
import {
  DiscussionSort,
  ModuleDiscussionData,
} from '@/types/learn/moduleDiscussion';

export const getModuleDiscussions = async (
  moduleId: string,
  options?: {
    submoduleId?: string | null;
    sort?: DiscussionSort;
  }
): Promise<ModuleDiscussionData[]> => {
  let query = supabase
    .from('module_discussions')
    .select(
      `
        id,
        module_id,
        submodule_id,
        lesson_id,
        author_id,
        body,
        like_count,
        reply_count,
        created_at,
        users!author_id (id, username, profile_picture_url)
      `
    )
    .eq('module_id', moduleId);

  if (options?.submoduleId) {
    query = query.eq('submodule_id', options.submoduleId);
  }

  if (options?.sort === 'liked') {
    query = query
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching module discussions:', error);
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    module_id: row.module_id,
    submodule_id: row.submodule_id,
    lesson_id: row.lesson_id,
    author_id: row.author_id,
    body: row.body,
    like_count: row.like_count,
    reply_count: row.reply_count,
    created_at: row.created_at,
    username: row.users?.username ?? '',
    profilePictureUrl: row.users?.profile_picture_url ?? undefined,
  }));
};
