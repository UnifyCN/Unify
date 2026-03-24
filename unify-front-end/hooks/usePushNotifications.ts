import { useEffect, useRef } from 'react';
import { type Href, useRouter } from 'expo-router';
import { useCurrentUser } from '@/context/UserContext';
import { useOnboardingProfile } from '@/hooks/onboarding/useOnboardingProfile';
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
  const { data: onboardingProfile } = useOnboardingProfile(currentUser?.id);
  const router = useRouter();
  const responseListenerRef = useRef<Subscription>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Only register for push if user opted in (or hasn't completed onboarding yet)
    if (onboardingProfile?.wants_reminders !== false) {
      registerForPushNotifications().catch(err => {
        console.error('Push notification registration failed:', err);
      });
    }

    // Handle notification taps
    responseListenerRef.current = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data;

      // Navigate based on notification type (with circle_id validation)
      if (data?.type === 'circle_matched' && isValidCircleId(data?.circle_id)) {
        router.push(`/community-matching/circle/${data.circle_id}` as const);
      } else if (
        data?.type === 'circle_ending_soon' &&
        isValidCircleId(data?.circle_id)
      ) {
        router.push(
          `/community-matching/circle/${data.circle_id}/chat` as const
        );
      } else if (
        data?.type === 'new_message' &&
        isValidCircleId(data?.circle_id)
      ) {
        router.push(
          `/community-matching/circle/${data.circle_id}/chat` as const
        );
      } else if (
        (data?.type === 'liked' || data?.type === 'commented') &&
        data?.post_id != null
      ) {
        router.push({
          pathname: '/post-details',
          params: { postId: String(data.post_id) },
        } as Href);
      } else if (
        data?.type === 'followed' &&
        data?.actor_user_id != null
      ) {
        router.push({
          pathname: '/profile/[userId]',
          params: { userId: String(data.actor_user_id) },
        } as Href);
      } else if (
        data?.type === 'learn_reminder' &&
        data?.lesson_id &&
        data?.submodule_id &&
        data?.module_id
      ) {
        router.push({
          pathname:
            '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]',
          params: {
            moduleId: String(data.module_id),
            submoduleId: String(data.submodule_id),
            lessonId: String(data.lesson_id),
          },
        } as Href);
      }
    });

    return () => {
      if (responseListenerRef.current) {
        responseListenerRef.current.remove();
      }
    };
  }, [currentUser, onboardingProfile?.wants_reminders, router]);
}
