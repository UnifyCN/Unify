import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ScrollContextProvider } from '@/context/ScrollContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import AuthWrapper from '@/components/AuthComponents/AuthWrapper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from 'posthog-react-native';
// import Onboarding from './onboarding';
import { useProgressCache } from '@/hooks/progress/useProgressCache';
import { UserProvider } from '@/context/UserContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create QueryClient outside component to ensure stable reference
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // const [onboardingChecked, setOnboardingChecked] = useState(false);
  // const [showOnboarding, setShowOnboarding] = useState(false);

  // Initialize progress cache
  const {
    isInitialized: progressCacheInitialized,
    isLoading: progressCacheLoading,
  } = useProgressCache();
  const [cacheTimeout, setCacheTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!progressCacheInitialized) {
        console.warn('Progress cache initialization timed out');
        setCacheTimeout(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [progressCacheInitialized]);

  // useEffect(() => {
  //   const checkOnboarding = async () => {
  //     const completed = await AsyncStorage.getItem('onboardingCompleted');
  //     setShowOnboarding(completed !== 'true');
  //     setOnboardingChecked(true);
  //   };
  //   checkOnboarding();
  // }, []);

  useEffect(() => {
    if (
      loaded &&
      // onboardingChecked &&
      (progressCacheInitialized || cacheTimeout)
    ) {
      SplashScreen.hideAsync();
    }
  }, [loaded, /* onboardingChecked, */ progressCacheInitialized, cacheTimeout]);

  // Always render QueryClientProvider to ensure React Query context is available
  // for all routes, even during initial loading
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          {!loaded ? (
            // Show loading indicator while fonts load, but keep providers mounted
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size='large' />
            </View>
          ) : (
            <ScrollContextProvider>
              {/* {showOnboarding ? (
                <Onboarding onFinish={() => setShowOnboarding(false)} />
              ) : ( */}
              <UserProvider>
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
                      <Stack>
                        <Stack.Screen
                          name='(tabs)'
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name='account-settings'
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name='edit-name'
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name='profile'
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name='saved'
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name='reset-password'
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name='post-details'
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name='legal-document'
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen name='+not-found' />
                      </Stack>
                    </PostHogProvider>
                  </ThemeProvider>
                </AuthWrapper>
              </UserProvider>
              {/* )} */}
            </ScrollContextProvider>
          )}
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
