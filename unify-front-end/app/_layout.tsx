import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ScrollContextProvider } from '@/context/ScrollContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import AuthWrapper from '@/components/AuthComponents/AuthWrapper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from 'posthog-react-native';
// import Onboarding from './onboarding';
import { useProgressCache } from '@/hooks/progress/useProgressCache';
import { UserProvider } from '@/context/UserContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { HapticsProvider } from '@/context/HapticsContext';
import { ToastProvider } from '@/context/ToastContext';
import AnimatedSplash from '@/components/AnimatedSplash';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // const [onboardingChecked, setOnboardingChecked] = useState(false);
  // const [showOnboarding, setShowOnboarding] = useState(false);

  // Intentionally fire-and-forget: useProgressCache internally calls
  // cachedProgressService.getProgressData(), and failures are logged but
  // should not block loaded/isReady/showAnimatedSplash startup flow.
  useProgressCache();
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  const isReady = loaded;

  // Create a client
  const queryClient = React.useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
    []
  );

  // useEffect(() => {
  //   const checkOnboarding = async () => {
  //     const completed = await AsyncStorage.getItem('onboardingCompleted');
  //     setShowOnboarding(completed !== 'true');
  //     setOnboardingChecked(true);
  //   };
  //   checkOnboarding();
  // }, []);

  useEffect(() => {
    if (isReady) {
      // Hide native splash immediately, AnimatedSplash will handle the transition
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  const handleSplashAnimationComplete = () => {
    setShowAnimatedSplash(false);
  };

  if (!loaded /* || !onboardingChecked */) {
    return null; // or a loading spinner
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <KeyboardProvider>
          <SafeAreaProvider>
            <ToastProvider>
              <ScrollContextProvider>
                {/* {showOnboarding ? (
              <Onboarding onFinish={() => setShowOnboarding(false)} />
            ) : ( */}
                <UserProvider>
                  <HapticsProvider>
                    <AuthWrapper>
                      <ThemeProvider value={DefaultTheme}>
                        <PostHogProvider
                          apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY || ''}
                          options={{
                            host:
                              process.env.EXPO_PUBLIC_POSTHOG_HOST ||
                              'https://us.i.posthog.com',
                          }}
                          autocapture={{ captureScreens: false }}
                        >
                          <AppContent />
                        </PostHogProvider>
                      </ThemeProvider>
                    </AuthWrapper>
                  </HapticsProvider>
                </UserProvider>
                {/* )} */}
              </ScrollContextProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
      {showAnimatedSplash && !isReady && (
        <AnimatedSplash onAnimationComplete={handleSplashAnimationComplete} />
      )}
    </QueryClientProvider>
  );
}

/**
 * Inner component that has access to UserContext for push notifications
 */
function AppContent() {
  // Initialize push notifications (requires UserContext)
  usePushNotifications();

  return (
    <Stack>
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen name='account-settings' options={{ headerShown: false }} />
      <Stack.Screen name='edit-name' options={{ headerShown: false }} />
      <Stack.Screen name='profile' options={{ headerShown: false }} />
      <Stack.Screen name='saved' options={{ headerShown: false }} />
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
      <Stack.Screen name='news-detail' options={{ headerShown: false }} />
      <Stack.Screen name='news-tips' options={{ headerShown: false }} />
      <Stack.Screen name='event-detail' options={{ headerShown: false }} />
      <Stack.Screen name='events' options={{ headerShown: false }} />
      <Stack.Screen name='create-post' options={{ headerShown: false }} />
      <Stack.Screen name='+not-found' />
    </Stack>
  );
}
