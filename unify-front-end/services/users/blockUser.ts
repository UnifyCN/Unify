import { supabase } from '@/lib/supabase';

export const blockUser = async (
  blockedUserId: string
): Promise<{ success: boolean }> => {
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('block-user', {
    body: { blockedUserId },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    throw new Error(`Failed to block user: ${error.message}`);
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to block user');
  }

  return data;
};
