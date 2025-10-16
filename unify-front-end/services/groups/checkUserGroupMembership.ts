import { supabase } from '@/lib/supabase';

export const checkUserGroupMembership = async (
  group_id: number
): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If there's no authenticated user, return false (not a member)
    if (!user) return false;

    const { data, error } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('user_id', user.id)
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
