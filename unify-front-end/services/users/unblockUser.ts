import { supabase } from '@/lib/supabase';

export const unblockUser = async (blockedUserId: string): Promise<void> => {
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedUserId);

  if (error) {
    throw new Error(`Failed to unblock user: ${error.message}`);
  }
};
