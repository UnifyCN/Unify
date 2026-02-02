import { useEffect, useMemo } from 'react';
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { usePostHog } from 'posthog-react-native';

export default function PostHogScreenTracker() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const params = useGlobalSearchParams();

  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params]);

  useEffect(() => {
    if (!posthog || !pathname) {
      return;
    }

    posthog.screen(pathname, params);
  }, [posthog, pathname, paramsKey]);

  return null;
}
