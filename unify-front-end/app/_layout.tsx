import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ScrollContextProvider } from '@/context/ScrollContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import AuthWrapper from '@/components/AuthComponents/AuthWrapper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from './onboarding';
import { FloatingChatButton } from '@/components/ChatBot';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await AsyncStorage.getItem('onboardingCompleted');
      setShowOnboarding(completed !== 'true');
      setOnboardingChecked(true);
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (loaded && onboardingChecked) {
      SplashScreen.hideAsync();
    }
  }, [loaded, onboardingChecked]);

  if (!loaded || !onboardingChecked) {
    return null; // or a loading spinner
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <SafeAreaProvider>
          <ScrollContextProvider>
            {showOnboarding ? (
              <Onboarding onFinish={() => setShowOnboarding(false)} />
            ) : (
              <AuthWrapper>
                <ThemeProvider value={DefaultTheme}>
                  <Stack>
                    <Stack.Screen
                      name='(tabs)'
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen name='+not-found' />
                  </Stack>
                  <FloatingChatButton />
                </ThemeProvider>
              </AuthWrapper>
            )}
          </ScrollContextProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
