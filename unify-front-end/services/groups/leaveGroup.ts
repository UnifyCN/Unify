import { supabase, getAuthUserId } from '@/lib/supabase';

export const leaveGroup = async (group_id: number) => {
  try {
    const userId = await getAuthUserId();

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('user_id', userId)
      .eq('group_id', group_id);

    if (error) {
      throw new Error('Failed to leave group');
    }

    return true;
  } catch (err) {
    console.error('leaveGroup error', err);
    throw err;
  }
};
