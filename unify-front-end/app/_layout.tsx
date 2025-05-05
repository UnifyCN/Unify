import React from 'react';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ScrollContextProvider } from '@/context/ScrollContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  Authenticator,
  AuthenticatorProps,
} from '@aws-amplify/ui-react-native';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

// import { ConfirmResetPassword } from './ConfirmResetPassword';
// import { ConfirmSignIn } from './ConfirmSignIn';
// import { ConfirmSignUp } from './ConfirmSignUp';
// import { ConfirmVerifyUser } from './ConfirmVerifyUser';
// import { ForceNewPassword } from './ForceNewPassword';
// import { ForgotPassword } from './ForgotPassword';
// import { SelectMfaType } from './SelectMfaType';
// import { SetupEmail } from './SetupEmail';
// import { SetupTotp } from './SetupTotp';
import { SignIn } from '../components/AuthComponents/SignIn';
import { SignUp } from '../components/AuthComponents/SignUp';
// import { VerifyUser } from './VerifyUser';
import { Container, SignOutButton } from '../components/AuthComponents/Components';
import Onboarding from './onboarding';

Amplify.configure(outputs);
const components: AuthenticatorProps['components'] = {
  // ConfirmResetPassword,
  // ConfirmSignIn,
  // ConfirmSignUp,
  // ConfirmVerifyUser,
  // ForceNewPassword,
  // ForgotPassword,
  // SelectMfaType,
  // SetupEmail,
  // SetupTotp,
  SignIn,
  SignUp,
  // VerifyUser,
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, hasCompletedOnboarding]);

  if (!loaded) {
    return null;
  }
  console.log(hasCompletedOnboarding);
  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>        
        {hasCompletedOnboarding ? (
            <Authenticator.Provider>
              <Authenticator Container={Container} components={components}>
                <ScrollContextProvider>
                  <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <Stack>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="+not-found" />
                    </Stack>
                  </ThemeProvider>
                </ScrollContextProvider>
              </Authenticator>
            </Authenticator.Provider>
          ) : (
            <ScrollContextProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                {/* <Stack>
                  <Stack.Screen
                    name="onboarding"
                    // options={{ headerShown: false }}
                    initialParams={{ setHasCompletedOnboarding }}
                  />
                </Stack> */}
                <Onboarding route={{ params: { setHasCompletedOnBoarding: setHasCompletedOnboarding } }} />
              </ThemeProvider>
            </ScrollContextProvider>
          )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}