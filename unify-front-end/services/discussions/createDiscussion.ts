import { supabase } from '@/lib/supabase';

export type CreateDiscussionInput = {
  moduleId: string;
  body: string;
  submoduleId?: string | null;
  lessonId?: string | null;
};

export const createDiscussion = async ({
  moduleId,
  body,
  submoduleId,
  lessonId,
}: CreateDiscussionInput) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('User not authenticated', authError);
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('module_discussions')
    .insert({
      module_id: moduleId,
      submodule_id: submoduleId ?? null,
      lesson_id: lessonId ?? null,
      author_id: user.id,
      body: body.trim(),
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating discussion:', error);
    throw new Error(error.message);
  }

  return data;
};
