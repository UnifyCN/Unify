import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ScrollContextProvider } from '@/context/ScrollContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import {
  i18nReady,
  setStoredLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@/i18n';
import { useOnboardingProfile } from '@/hooks/onboarding/useOnboardingProfile';
import AuthWrapper from '@/components/AuthComponents/AuthWrapper';
import { QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from 'posthog-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PreLoginOnboarding from '@/components/onboarding/PreLoginOnboarding';
import { UserProvider, useCurrentUser } from '@/context/UserContext';
import { useAnalytics } from '@/utils/analytics';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { HapticsProvider } from '@/context/HapticsContext';
import { ToastProvider } from '@/context/ToastContext';
import { InviteCodeProvider } from '@/context/InviteCodeContext';
import { ClipboardListener } from '@/components/referrals/ClipboardListener';
import AnimatedSplash from '@/components/AnimatedSplash';
import { queryClient } from '@/lib/queryClient';
import {
  FunnelSans_400Regular,
  FunnelSans_500Medium,
  FunnelSans_600SemiBold,
} from '@expo-google-fonts/funnel-sans';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    FunnelSans_400Regular,
    FunnelSans_500Medium,
    FunnelSans_600SemiBold,
  });

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [i18nLoaded, setI18nLoaded] = useState(false);

  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  const isReady = loaded && onboardingChecked && i18nLoaded;

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem('onboardingCompleted');
        setShowOnboarding(completed !== 'true');
      } catch (e) {
        console.error('Failed to read onboarding status:', e);
        setShowOnboarding(false);
      } finally {
        setOnboardingChecked(true);
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    i18nReady
      .catch(e => console.error('Failed to initialize i18n:', e))
      .finally(() => setI18nLoaded(true));
  }, []);

  useEffect(() => {
    if (isReady) {
      // Hide native splash immediately, AnimatedSplash will handle the transition
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  const handleSplashAnimationComplete = () => {
    setShowAnimatedSplash(false);
  };

  const handleBackToOnboarding = useCallback(async () => {
    await AsyncStorage.removeItem('onboardingCompleted');
    setShowOnboarding(true);
  }, []);

  if (!isReady) {
    return null; // splash stays up via SplashScreen.preventAutoHideAsync
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PostHogProvider
        apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY || ''}
        options={{
          host:
            process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        }}
        autocapture={{ captureScreens: false }}
      >
        <GestureHandlerRootView>
          <KeyboardProvider>
            <SafeAreaProvider>
              <ToastProvider>
                <ScrollContextProvider>
                  {/* InviteCodeProvider + ClipboardListener live ABOVE the
                      pre-login/auth conditional so the first-launch clipboard
                      probe runs on app cold start regardless of which path
                      the user is on (pre-login onboarding vs authed app).
                      Otherwise an invite-code-bearing pasteboard would be
                      missed for any new user who lands on PreLoginOnboarding. */}
                  <InviteCodeProvider>
                    <ClipboardListener />
                    {showOnboarding ? (
                      <PreLoginOnboarding
                        onFinish={() => setShowOnboarding(false)}
                      />
                    ) : (
                      <UserProvider>
                        <HapticsProvider>
                          <AuthWrapper
                            onBackToOnboarding={handleBackToOnboarding}
                          >
                            <ThemeProvider value={DefaultTheme}>
                              <AppContent />
                            </ThemeProvider>
                          </AuthWrapper>
                        </HapticsProvider>
                      </UserProvider>
                    )}
                  </InviteCodeProvider>
                </ScrollContextProvider>
              </ToastProvider>
            </SafeAreaProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </PostHogProvider>
      {showAnimatedSplash && (
        <AnimatedSplash onAnimationComplete={handleSplashAnimationComplete} />
      )}
    </QueryClientProvider>
  );
}

/**
 * Syncs PostHog identity with the current authenticated user.
 * - identify on sign-in / user-info load
 * - reset when the user signs out (id transitions to null)
 */
function useAnalyticsIdentitySync() {
  const { currentUser } = useCurrentUser();
  const { identify, reset } = useAnalytics();
  const { i18n } = useTranslation();
  const lastIdRef = useRef<string | null>(null);
  const lastTraitsRef = useRef<string>('');
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Cold-start: PostHog persists distinct_id to AsyncStorage, so on app
    // launch the SDK may still hold the prior session's identity. If the
    // user isn't authenticated when this effect first runs, clear that
    // stale identity so pre-auth events (auth screens, app_opened) don't
    // get attributed to whoever was last logged in on this device.
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      if (!currentUser?.id) {
        reset();
      }
    }

    if (currentUser?.id) {
      const traits = {
        email: currentUser.email,
        username: currentUser.username,
        persona: currentUser.persona ?? null,
        is_premium: currentUser.isPremium,
        city: currentUser.city,
        province: currentUser.province,
        arrival_date: currentUser.arrivalDate,
        stage: currentUser.stage,
        language: i18n.language,
      };
      const traitsKey = JSON.stringify(traits);
      const idChanged = currentUser.id !== lastIdRef.current;
      const traitsChanged = traitsKey !== lastTraitsRef.current;
      // Re-send identify when the user changes OR any tracked trait changes
      // (persona, city, premium, etc.) so PostHog person properties stay fresh.
      if (idChanged || traitsChanged) {
        identify(currentUser.id, traits);
        lastIdRef.current = currentUser.id;
        lastTraitsRef.current = traitsKey;
      }
    } else if (!currentUser?.id && lastIdRef.current) {
      reset();
      lastIdRef.current = null;
      lastTraitsRef.current = '';
    }
  }, [
    currentUser?.id,
    currentUser?.email,
    currentUser?.username,
    currentUser?.persona,
    currentUser?.isPremium,
    currentUser?.city,
    currentUser?.province,
    currentUser?.arrivalDate,
    currentUser?.stage,
    i18n.language,
    identify,
    reset,
  ]);
}

/**
 * On first authed mount, if the user's preferred_language stored in Supabase
 * differs from the local i18n language, switch local to match. Lets users keep
 * their language across devices/reinstalls. One-shot per session.
 */
function useLanguageSyncFromSupabase() {
  const { currentUser } = useCurrentUser();
  const { i18n } = useTranslation();
  const { data: profile } = useOnboardingProfile(currentUser?.id);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (syncedRef.current) return;
    if (!currentUser?.id || !profile) return;
    const remote = profile.preferred_language;
    if (remote && remote !== i18n.language && remote in SUPPORTED_LANGUAGES) {
      syncedRef.current = true;
      setStoredLanguage(remote as SupportedLanguage).catch(e =>
        console.error('Failed to sync language from supabase:', e)
      );
    } else if (remote) {
      syncedRef.current = true;
    }
  }, [currentUser?.id, profile, i18n.language]);
}

/**
 * Inner component that has access to UserContext for push notifications
 */
function AppContent() {
  // Initialize push notifications (requires UserContext)
  usePushNotifications();
  // Identify the user with PostHog whenever auth state resolves
  useAnalyticsIdentitySync();
  // Restore language from Supabase on first authed mount
  useLanguageSyncFromSupabase();

  return (
    <Stack>
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen name='account-settings' options={{ headerShown: false }} />
      <Stack.Screen name='edit-name' options={{ headerShown: false }} />
      <Stack.Screen name='profile' options={{ headerShown: false }} />
      <Stack.Screen name='saved' options={{ headerShown: false }} />
      <Stack.Screen name='saved-lessons' options={{ headerShown: false }} />
      <Stack.Screen name='reset-password' options={{ headerShown: false }} />
      <Stack.Screen name='post-details' options={{ headerShown: false }} />
      <Stack.Screen name='notifications' options={{ headerShown: false }} />
      <Stack.Screen
        name='community-matching'
        options={{ headerShown: false }}
      />
      <Stack.Screen name='legal-document' options={{ headerShown: false }} />
      <Stack.Screen name='search' options={{ headerShown: false }} />
      <Stack.Screen name='group-detail' options={{ headerShown: false }} />
      <Stack.Screen name='see-more-posts' options={{ headerShown: false }} />
      <Stack.Screen name='see-more-groups' options={{ headerShown: false }} />
      <Stack.Screen name='see-more-users' options={{ headerShown: false }} />
      <Stack.Screen name='news-detail' options={{ headerShown: false }} />
      <Stack.Screen name='news-tips' options={{ headerShown: false }} />
      <Stack.Screen name='past-tips' options={{ headerShown: false }} />
      <Stack.Screen name='tip-detail' options={{ headerShown: false }} />
      <Stack.Screen name='event-detail' options={{ headerShown: false }} />
      <Stack.Screen name='events' options={{ headerShown: false }} />
      <Stack.Screen name='create-post' options={{ headerShown: false }} />
      <Stack.Screen name='redo-onboarding' options={{ headerShown: false }} />
      <Stack.Screen
        name='followers-following'
        options={{ headerShown: false }}
      />
      <Stack.Screen name='refer-a-friend' options={{ headerShown: false }} />
      <Stack.Screen
        name='welcome-from-inviter'
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name='+not-found' />
    </Stack>
  );
}
