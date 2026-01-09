import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/context/UserContext';
import {
  getCommunityNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notifications/notifications';
import type { CommunityNotification } from '@/types/matching';

const QUERY_KEY_NOTIFICATIONS = ['community-notifications'];
const QUERY_KEY_UNREAD_COUNT = ['community-notifications-unread-count'];

export function useCommunityNotifications() {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY_NOTIFICATIONS,
    queryFn: getCommunityNotifications,
    enabled: !!currentUser,
    staleTime: 30_000, // 30 seconds
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: QUERY_KEY_UNREAD_COUNT,
    queryFn: getUnreadNotificationCount,
    enabled: !!currentUser,
    staleTime: 30_000,
  });

  // Set up realtime subscription for new notifications
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const channel = supabase
      .channel(`community-notifications-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => {
          // Refetch notifications when a new one arrives
          queryClient.invalidateQueries({ queryKey: QUERY_KEY_NOTIFICATIONS });
          queryClient.invalidateQueries({ queryKey: QUERY_KEY_UNREAD_COUNT });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_NOTIFICATIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_UNREAD_COUNT });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_NOTIFICATIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_UNREAD_COUNT });
    },
  });

  const markAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutation.mutate(notificationId);
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
}

/**
 * Lightweight hook for just the unread count (for header badge).
 */
export function useUnreadNotificationCount() {
  const { currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: QUERY_KEY_UNREAD_COUNT,
    queryFn: getUnreadNotificationCount,
    enabled: !!currentUser,
    staleTime: 30_000,
  });

  // Set up realtime subscription for new notifications
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const channel = supabase
      .channel(`community-notifications-count-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEY_UNREAD_COUNT });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, queryClient]);

  return unreadCount;
}
