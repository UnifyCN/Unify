import React from 'react';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ScrollContextProvider } from '@/context/ScrollContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import {
  MD3LightTheme as LightTheme,
  PaperProvider,
} from 'react-native-paper';

import { useColorScheme } from '@/hooks/useColorScheme';
import {
  Authenticator,
  AuthenticatorProps,
} from '@aws-amplify/ui-react-native';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

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
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <Authenticator.Provider>
          <Authenticator Container={Container} components={components}>
            {/* Content shown after the user logs in */}
            <ScrollContextProvider>
              <ThemeProvider value={DefaultTheme}>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </ThemeProvider>
            </ScrollContextProvider>
          </Authenticator>
        </Authenticator.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}