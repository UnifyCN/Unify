import { supabase } from '@/lib/supabase';

export const leaveGroup = async (group_id: string | number) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('user_id', user.id)
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
