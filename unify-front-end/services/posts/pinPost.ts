import { supabase } from '@/lib/supabase';

/**
 * Pin a post (admin only).
 * Uses SECURITY DEFINER RPC function that validates admin permissions.
 */
export const pinPost = async (postId: number): Promise<void> => {
  const { error } = await supabase.rpc('pin_post', { post_id: postId });

  if (error) {
    throw new Error(error.message || 'Failed to pin post');
  }
};
