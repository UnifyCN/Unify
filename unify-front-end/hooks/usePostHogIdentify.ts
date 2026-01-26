import { useEffect } from 'react';
import { usePostHog } from 'posthog-react-native';
import { useCurrentUser } from '@/context/UserContext';

/**
 * Hook that syncs user identity with PostHog when auth state changes.
 * - Identifies users when they log in (with email, username, premium status)
 * - Resets PostHog when users log out to prevent data leakage between sessions
 *
 * Must be used within both PostHogProvider and UserProvider contexts.
 */
export function usePostHogIdentify() {
  const posthog = usePostHog();
  const { currentUser, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading || !posthog) return;

    if (currentUser) {
      // Identify user when logged in
      posthog.identify(currentUser.id, {
        email: currentUser.email,
        username: currentUser.username,
        is_premium: currentUser.isPremium,
      });
    } else {
      // Reset when logged out to clear user data and start fresh session
      posthog.reset();
    }
  }, [currentUser, isLoading, posthog]);
}
