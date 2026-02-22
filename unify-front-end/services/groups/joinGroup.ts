import { supabase, getAuthUserId } from '@/lib/supabase';

export const joinGroup = async (group_id: number) => {
  try {
    const userId = await getAuthUserId();

    const { data, error } = await supabase
      .from('group_members')
      .insert([{ user_id: userId, group_id }])
      .select();

    if (error) {
      throw new Error('Failed to join group');
    }

    return data;
  } catch (err) {
    console.error('joinGroup error', err);
    throw err;
  }
};
