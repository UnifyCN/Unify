import { supabase } from '@/lib/supabase';

export const joinGroup = async (group_id: string | number) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('group_members')
      .insert([{ user_id: user.id, group_id }])
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
