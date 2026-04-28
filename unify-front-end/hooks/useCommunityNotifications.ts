import { useEffect, useCallback, useId } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/context/UserContext';
import {
  getCommunityNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notifications/notifications';

// User-scoped query key functions to prevent cache leaks between users
const notificationsQueryKey = (userId: string | undefined) => [
  'community-notifications',
  userId,
];
const unreadCountQueryKey = (userId: string | undefined) => [
  'community-notifications-unread-count',
  userId,
];

export function useCommunityNotifications() {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const instanceId = useId();

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: notificationsQueryKey(currentUser?.id),
    queryFn: getCommunityNotifications,
    enabled: !!currentUser,
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Poll every 60s so recipient sees new notifications even if realtime misses
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: unreadCountQueryKey(currentUser?.id),
    queryFn: getUnreadNotificationCount,
    enabled: !!currentUser,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Set up realtime subscription for new notifications
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const channel = supabase
      .channel(`community-notifications-${currentUser.id}-${instanceId}`)
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
          queryClient.invalidateQueries({
            queryKey: notificationsQueryKey(currentUser.id),
          });
          queryClient.invalidateQueries({
            queryKey: unreadCountQueryKey(currentUser.id),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, queryClient, instanceId]);

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationsQueryKey(currentUser?.id),
      });
      queryClient.invalidateQueries({
        queryKey: unreadCountQueryKey(currentUser?.id),
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationsQueryKey(currentUser?.id),
      });
      queryClient.invalidateQueries({
        queryKey: unreadCountQueryKey(currentUser?.id),
      });
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
  const instanceId = useId();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: unreadCountQueryKey(currentUser?.id),
    queryFn: getUnreadNotificationCount,
    enabled: !!currentUser,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Set up realtime subscription for new notifications
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const channel = supabase
      .channel(`community-notifications-count-${currentUser.id}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: unreadCountQueryKey(currentUser.id),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, queryClient, instanceId]);

  return unreadCount;
}
