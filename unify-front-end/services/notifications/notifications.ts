import { supabase } from '@/lib/supabase';
import type { CommunityNotification } from '@/types/matching';

/**
 * Fetch all community notifications for the current user.
 * Ordered by created_at descending (newest first).
 */
export const getCommunityNotifications = async (): Promise<CommunityNotification[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('community_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load notifications: ${error.message}`);
  }

  return (data as CommunityNotification[]) ?? [];
};

/**
 * Get count of unread community notifications for the current user.
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { count, error } = await supabase
    .from('community_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null);

  if (error) {
    throw new Error(`Failed to count unread notifications: ${error.message}`);
  }

  return count ?? 0;
};

/**
 * Mark a single notification as read.
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('community_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
};

/**
 * Mark all notifications as read for the current user.
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('community_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);

  if (error) {
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }
};
