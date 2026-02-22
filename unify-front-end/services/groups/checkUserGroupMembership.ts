import { supabase, getAuthUserId } from '@/lib/supabase';

export const checkUserGroupMembership = async (
  group_id: number
): Promise<boolean> => {
  try {
    const userId = await getAuthUserId();

    const { data, error } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('user_id', userId)
      .eq('group_id', group_id)
      .maybeSingle();

    if (error) {
      console.error('checkUserGroupMembership supabase error', error);
      return false;
    }

    return data !== null;
  } catch (err) {
    console.error('checkUserGroupMembership unexpected error', err);
    return false;
  }
};
