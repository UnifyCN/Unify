import { supabase } from '@/lib/supabase';
import { sanitizeFirstName } from '@/utils/sanitizeFirstName';

export const updateFirstName = async (
  rawValue: string
): Promise<{ success: boolean; error?: string }> => {
  const sanitized = sanitizeFirstName(rawValue);
  if (!sanitized) {
    return { success: false, error: 'First name is required' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('users')
    .update({ first_name: sanitized })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};
