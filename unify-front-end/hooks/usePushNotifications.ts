import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useCurrentUser } from '@/context/UserContext';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
} from '@/services/push/pushNotifications';
import type { Subscription } from 'expo-notifications';

/**
 * Validates that a circle_id is a non-empty string
 */
const isValidCircleId = (id: unknown): id is string =>
  typeof id === 'string' && id.trim() !== '';

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
    registerForPushNotifications().catch((err) => {
      console.error('Push notification registration failed:', err);
    });

    // Handle notification taps
    responseListenerRef.current = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data;

      // Navigate based on notification type (with circle_id validation)
      if (data?.type === 'circle_matched' && isValidCircleId(data?.circle_id)) {
        router.push(`/community-matching/circle/${data.circle_id}` as const);
      } else if (data?.type === 'circle_ending_soon' && isValidCircleId(data?.circle_id)) {
        router.push(`/community-matching/circle/${data.circle_id}/chat` as const);
      } else if (data?.type === 'new_message' && isValidCircleId(data?.circle_id)) {
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
