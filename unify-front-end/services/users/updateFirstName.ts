import { supabase } from '@/lib/supabase';
import { sanitizeFirstName } from '@/utils/sanitizeFirstName';

export type UpdateFirstNameErrorCode = 'NOT_AUTHENTICATED' | 'DB_ERROR';

export type UpdateFirstNameResult =
  | { success: true }
  | { success: false; code: UpdateFirstNameErrorCode; message?: string };

/**
 * Persist the user's first name. An empty/whitespace/emoji-only input clears
 * the field (NULL) so users can revoke their name later — the public @handle
 * stays untouched. Returns stable error codes; callers translate for UI.
 */
export const updateFirstName = async (
  rawValue: string
): Promise<UpdateFirstNameResult> => {
  const sanitized = sanitizeFirstName(rawValue);
  const valueToPersist = sanitized.length > 0 ? sanitized : null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, code: 'NOT_AUTHENTICATED' };
  }

  const { error } = await supabase
    .from('users')
    .update({ first_name: valueToPersist })
    .eq('id', user.id);

  if (error) {
    return { success: false, code: 'DB_ERROR', message: error.message };
  }

  return { success: true };
};
