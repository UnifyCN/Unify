import React, { useState } from 'react';
import isExpoGo from '../../utils/isExpoGo'; // see if we are running dev env using expo go or not
import ForgotPassword from './ForgotPassword';
import { InputField } from './InputField';

import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button } from 'react-native-paper';
import { Platform } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Google from '../../assets/images/Google.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useQueryClient } from '@tanstack/react-query';
import { getUserInfo } from '@/services/users/getUserInfo';
import { createUserIfNotExists } from '../../utils/createUserIfNotExists';
import {
  ErrorMessage,
  LinkButton,
  LinksContainer,
  ProviderButton,
  SubmitButton,
  TextField,
  ViewHeader,
  ViewContainer,
  ViewSection,
  ViewDivider,
  SimpleTextField,
} from './Components';
import { Theme } from '@/constants/Theme';

function capitalize<T extends string>([first, ...rest]: T): Capitalize<T> {
  return [first && first.toUpperCase(), rest.join('').toLowerCase()]
    .filter(Boolean)
    .join('') as Capitalize<T>;
}
import { useAnalytics } from '@/utils/analytics';

export function SignIn({
  onSwitchToSignUp,
}: {
  onSwitchToSignUp?: () => void;
}): React.JSX.Element {
  const queryClient = useQueryClient();
  const { trackSignInCompleted, trackSignInFailed, trackGoogleSignInUsed } =
    useAnalytics();
  // State for email tick and password eye icon toggle
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [isEmailValid, setIsEmailValid] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const insets = useSafeAreaInsets();

  // Simple email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Method to validate if email is in valid format for the tick icon to appear
  // Trim before testing to match handleSignIn behavior
  const validateEmail = (emailInput: string) => {
    setIsEmailValid(emailRegex.test(emailInput.trim()));
  };

  // Supabase sign in
  const handleSignIn = async () => {
    setErrorMessage(null);

    // Normalize email: trim whitespace and lowercase for consistency
    // Do NOT trim password - it may legitimately contain leading/trailing spaces
    const normalizedEmail = email.trim().toLowerCase();

    // Check for empty fields - show generic error
    if (!normalizedEmail || !password) {
      setErrorMessage('Invalid login credentials');
      trackSignInFailed('empty_fields');
      return;
    }

    // Check for invalid email format - show same generic error
    if (!emailRegex.test(normalizedEmail)) {
      setErrorMessage('Invalid login credentials');
      trackSignInFailed('invalid_email');
      return;
    }

    // Only attempt authentication if both fields are valid
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password, // Use password as-is to match signup behavior
    });
    if (error) {
      setErrorMessage('Invalid login credentials');
      trackSignInFailed(error.code || 'signin_failed');
      setLoading(false);
      return;
    }

    // Prefetch user info immediately after successful login and wait for it
    if (data?.user?.id) {
      await queryClient.ensureQueryData({
        queryKey: ['userInfo', data.user.id],
        queryFn: () => getUserInfo(data.user.id),
      });
    }

    trackSignInCompleted();
    setLoading(false);
  };

  // Configure Google Sign-In once on mount (must happen BEFORE calling signIn)
  React.useEffect(() => {
    GoogleSignin.configure({
      iosClientId:
        '718278262223-rfq8s91jg7o9lmif54gcuibf4732ce7l.apps.googleusercontent.com',

      webClientId:
        '718278262223-f9pif0vn68o30v4ppskpllo6ka0hjvj2.apps.googleusercontent.com',
      scopes: ['email', 'profile', 'openid'],
      offlineAccess: true,
      forceCodeForRefreshToken: false,
    });
  }, []);

  // Move Google sign-in logic to a separate function
  const handleGoogleSignIn = async () => {
    if (isExpoGo) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) setErrorMessage(error.message);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    trackGoogleSignInUsed('sign_in');

    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      if (idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

        // Create user record if it doesn't exist (for Google sign-in users)
        if (data?.user?.id && data?.user?.email) {
          try {
            await createUserIfNotExists(data.user.id, data.user.email);
          } catch (userCreationError: any) {
            console.error('Failed to create user record:', userCreationError);
            setErrorMessage(
              userCreationError?.message || 'Failed to complete sign-in setup'
            );
            setLoading(false);
            return;
          }

          // Prefetch user info immediately after successful Google login
          await queryClient.ensureQueryData({
            queryKey: ['userInfo', data.user.id],
            queryFn: () => getUserInfo(data.user.id),
          });
        } else if (data?.user?.id && !data?.user?.email) {
          setErrorMessage('Unable to retrieve email from Google account');
          setLoading(false);
          return;
        } else if (!data?.user?.id) {
          setErrorMessage('Unable to retrieve user information from Google');
          setLoading(false);
          return;
        }
      } else {
        setErrorMessage('No Google idToken');
      }
    } catch (error: any) {
      if (error?.code === statusCodes.IN_PROGRESS) {
        setLoading(false);
        return; // already in progress
      }
      if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErrorMessage('Google Play Services not available');
        setLoading(false);
        return;
      }
      setErrorMessage(error?.message || 'Google sign-in failed');
    }
    setLoading(false);
  };

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <ViewContainer style={styles.container}>
      <ViewHeader style={[styles.header, {paddingTop: insets.top + 140}]}>Log In</ViewHeader>
      <ViewSection style={{ marginTop: 30 }}>
        <InputField
          label='Email Address'
          value={email}
          onChangeText={text => {
            setEmail(text);
            validateEmail(text);
          }}
          placeholder='Email address'
          showValidIcon={isEmailValid}
          error={!!errorMessage}
        />
        <InputField
          label='Password'
          value={password}
          onChangeText={setPassword}
          placeholder='Password'
          secureTextEntry
          showPasswordToggle
          passwordVisible={passwordVisible}
          onTogglePassword={() => setPasswordVisible(!passwordVisible)}
          error={!!errorMessage}
        />
        {errorMessage && (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        )}
      </ViewSection>

      
      {/* <View style={{ alignItems: 'flex-end'}}>
        <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
          <Text style={[styles.link, styles.linkText]}>
            Forgot password?
          </Text>
        </TouchableOpacity>
      </View> */}

      <SubmitButton
        loading={loading}
        onPress={handleSignIn}
        style={[styles.button]}
        labelStyle={[styles.buttonText]}
      >
        Log in
      </SubmitButton>

      <View style={styles.orLogIn}>
        <View style={styles.lineView}></View>
        <Text style={styles.orText}>or</Text>
        <View style={styles.lineView}></View>
      </View>
      <View style={styles.buttonBucket}>

        <TouchableOpacity
          style={styles.buttonWithIcon}
          onPress={handleGoogleSignIn}
        >
          <Google width={20} height={20} />
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Text
          style={{
            fontSize: 14,
            lineHeight: 18,
            color: 'rgba(0, 0, 0, 0.7)',
            textAlign: 'left',
          }}
        >
          Don't have an account?
        </Text>
        <Text
          style={{
            fontSize: 14,
            lineHeight: 18,
            fontWeight: '600',
            textAlign: 'left',
            color: '#000',
          }}
          onPress={onSwitchToSignUp}
        >
          Sign up
        </Text>
      </View>
    </ViewContainer>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: '700' as '700',
    color: '#000',
  },
  button: {
    backgroundColor: Theme.black,
    borderRadius: 10,
    marginVertical: 42,
    width: '100%' as '100%',
    height: 50,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center' as 'center',
    fontSize: 16,
  },
  errorMessage: {
    marginTop: -14,
    color: '#f00',
    fontSize: 12,
    fontWeight: '600' as '600',
  },
  link: {
    color: '#5182C7',
    textDecorationLine: 'underline' as 'underline',
  },
  linkText: {
    color: '#5182C7',
    fontSize: 15 * 0.87,
    fontWeight: '400' as '400',
  },
  label: {
    fontSize: 16 * 0.87,
    fontWeight: '400' as '400',
  },
  orLogIn: {
    marginTop: 22,
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
  },
  lineView: {
    borderStyle: 'solid' as 'solid',
    borderColor: '#d8dadc',
    borderTopWidth: 1,
    flex: 1,
    width: '100%' as '100%',
    height: 1,
  },
  orText: {
    color: 'rgba(0, 0, 0, 0.7)',
    fontSize: 14,
    lineHeight: 18,
    marginHorizontal: 10,
  },
  buttonBucket: {
    marginTop: 22,
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    gap: 15,
  },
  buttonWithIcon: {
    borderRadius: 10,
    backgroundColor: '#fff',
    borderStyle: 'solid' as 'solid',
    borderColor: '#d8dadc',
    borderWidth: 1,
    flex: 1,
    width: '100%' as '100%',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    paddingHorizontal: 45,
    paddingVertical: 18,
  },
  footer: {
    marginTop: 50,
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    gap: 5,
  },
};
