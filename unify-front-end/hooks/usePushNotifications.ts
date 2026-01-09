import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useCurrentUser } from '@/context/UserContext';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
} from '@/services/push/pushNotifications';
import type { Subscription } from 'expo-notifications';

/**
 * Hook to initialize push notifications.
 * Should be called once in a component that has access to UserContext and router.
 */
export function usePushNotifications() {
  const { currentUser } = useCurrentUser();
  const router = useRouter();
  const responseListenerRef = useRef<Subscription>();

  useEffect(() => {
    if (!currentUser) return;

    // Register for push notifications when user is authenticated
    registerForPushNotifications();

    // Handle notification taps
    responseListenerRef.current = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data;

      // Navigate based on notification type
      if (data?.type === 'circle_matched' && data?.circle_id) {
        router.push(`/community-matching/circle/${data.circle_id}` as const);
      } else if (data?.type === 'circle_ending_soon' && data?.circle_id) {
        router.push(`/community-matching/circle/${data.circle_id}/chat` as const);
      } else if (data?.type === 'new_message' && data?.circle_id) {
        router.push(`/community-matching/circle/${data.circle_id}/chat` as const);
      }
    });

    return () => {
      if (responseListenerRef.current) {
        responseListenerRef.current.remove();
      }
    };
  }, [currentUser, router]);
}
