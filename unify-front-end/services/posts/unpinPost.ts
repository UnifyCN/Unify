import { supabase } from '@/lib/supabase';

/**
 * Unpin a post (admin only).
 * Uses SECURITY DEFINER RPC function that validates admin permissions.
 */
export const unpinPost = async (postId: number): Promise<void> => {
  const { error } = await supabase.rpc('unpin_post', { post_id: postId });

  if (error) {
    throw new Error(error.message || 'Failed to unpin post');
  }
};
