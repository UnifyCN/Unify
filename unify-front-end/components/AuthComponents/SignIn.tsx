import React, { useState } from 'react';
import isExpoGo from '../../utils/isExpoGo';
import ForgotPassword from './ForgotPassword';
import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Platform } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import Google from '../../assets/images/Google.svg';
import { useQueryClient } from '@tanstack/react-query';
import { getUserInfo } from '@/services/users/getUserInfo';
import { createUserIfNotExists } from '../../utils/createUserIfNotExists';
import {
  LinkButton,
  LinksContainer,
  SubmitButton,
  ViewHeader,
  ViewContainer,
  ViewSection,
  SimpleTextField,
} from './Components';
import { useAnalytics } from '@/utils/analytics';
import OTPPasswordReset from './OTPPasswordReset';

export function SignIn({
  onSwitchToSignUp,
}: {
  onSwitchToSignUp?: () => void;
}): React.JSX.Element {
  const queryClient = useQueryClient();
  const {
    trackSignInCompleted,
    trackSignInFailed,
    trackGoogleSignInUsed,
    trackAppleSignInUsed,
  } = useAnalytics();
  // State for email tick and password eye icon toggle
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [isEmailValid, setIsEmailValid] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOTPReset, setShowOTPReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

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

  const handleAppleSignIn = async () => {
    if (isExpoGo) return;

    setLoading(true);
    setErrorMessage(null);
    trackAppleSignInUsed('sign_in');

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

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

          await queryClient.ensureQueryData({
            queryKey: ['userInfo', data.user.id],
            queryFn: () => getUserInfo(data.user.id),
          });
        } else if (data?.user?.id && !data?.user?.email) {
          setErrorMessage('Unable to retrieve email from Apple account');
          setLoading(false);
          return;
        } else if (!data?.user?.id) {
          setErrorMessage('Unable to retrieve user information from Apple');
          setLoading(false);
          return;
        }
      } else {
        setErrorMessage('No Apple identity token received');
      }
    } catch (error: any) {
      if (error?.code === 'ERR_REQUEST_CANCELED') {
        setLoading(false);
        return;
      }
      setErrorMessage(error?.message || 'Apple sign-in failed');
    }
    setLoading(false);
  };

  if (showOTPReset) {
    return (
      <OTPPasswordReset
        email={resetEmail}
        onBack={() => {
          setShowOTPReset(false);
          setShowForgotPassword(true);
          setResetEmail('');
        }}
        onSuccess={() => {
          setShowOTPReset(false);
          setShowForgotPassword(false);
          setResetEmail('');
        }}
      />
    );
  }

  if (showForgotPassword) {
    return (
      <ForgotPassword
        onBack={() => {
          setShowForgotPassword(false);
          setResetEmail('');
        }}
        onCodeSent={sentEmail => {
          setResetEmail(sentEmail);
          setShowForgotPassword(false);
          setShowOTPReset(true);
        }}
      />
    );
  }

  return (
    <ViewContainer style={styles.container}>
      <ViewHeader style={styles.header}>Log In</ViewHeader>
      <ViewSection style={{ marginTop: 30 }}>
        <View style={{ position: 'relative' }}>
          <Text style={styles.label}>Email Address</Text>
          <SimpleTextField
            value={email}
            onChangeText={text => {
              setEmail(text);
              validateEmail(text);
            }}
            // name="email"
            placeholder='Email address'
            style={[styles.textField, errorMessage && { borderColor: '#f00' }]}
            autoCapitalize='none'
          />
          {isEmailValid && (
            <MaterialIcons
              name='check-circle'
              size={24}
              color='#333'
              style={styles.tickIcon}
            />
          )}
        </View>
        <View>
          <Text style={styles.label}>Password</Text>
          <SimpleTextField
            value={password}
            onChangeText={setPassword}
            // name="password"
            placeholder='Password'
            style={[styles.textField, errorMessage && { borderColor: '#f00' }]}
            secureTextEntry={!passwordVisible}
            autoCapitalize='none'
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.eyeIcon}
          >
            <MaterialIcons
              name={passwordVisible ? 'visibility' : 'visibility-off'}
              size={24}
              color='#333'
            />
          </TouchableOpacity>
        </View>
        {errorMessage && (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        )}
      </ViewSection>

      <SubmitButton
        loading={loading}
        onPress={handleSignIn}
        style={[styles.button]}
        labelStyle={[styles.buttonText]}
      >
        Log in
      </SubmitButton>

      <LinksContainer>
        <LinkButton
          onPress={() => setShowForgotPassword(true)}
          style={undefined}
          labelStyle={[styles.link, styles.linkText]}
        >
          Forgot Password?
        </LinkButton>
      </LinksContainer>

      <View style={styles.orLogIn}>
        <View style={styles.lineView}></View>
        <Text style={styles.orText}>Or Login with</Text>
        <View style={styles.lineView}></View>
      </View>
      <View style={styles.buttonBucket}>
        <TouchableOpacity
          style={styles.buttonWithIcon}
          onPress={handleGoogleSignIn}
        >
          <Google width={20} height={20} />
        </TouchableOpacity>
        {Platform.OS === 'ios' && !isExpoGo && (
          <TouchableOpacity
            style={styles.buttonWithIcon}
            onPress={handleAppleSignIn}
          >
            <Ionicons name='logo-apple' size={22} color='#000' />
          </TouchableOpacity>
        )}
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
            textDecorationLine: 'underline',
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
    padding: 16 * 0.87,
    paddingLeft: 24 * 0.87,
    paddingRight: 24 * 0.87,
  },
  header: {
    fontSize: 34 * 0.87,
    fontWeight: '700' as '700',
    color: '#000',
    marginBottom: 7 * 0.87,
    marginTop: 110 * 0.87,
  },
  button: {
    backgroundColor: '#343434',
    borderRadius: 40 * 0.87,
    marginTop: 37 * 0.87,
    width: 110 * 0.87,
    height: 42 * 0.87,
    alignSelf: 'center' as 'center',
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center' as 'center',
    fontSize: 16 * 0.87,
  },
  textField: {
    backgroundColor: '#fff',
    color: '#000',
    borderColor: '#ccc',
    borderWidth: 1 * 0.87,
    borderRadius: 12 * 0.87,
    padding: 8 * 0.87,
    height: 57,
  },
  errorMessage: {
    color: '#f00',
    fontSize: 14 * 0.87,
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
    color: '#000',
    marginBottom: 8 * 0.87,
    marginTop: 13 * 0.87,
  },
  eyeIcon: {
    position: 'absolute' as 'absolute',
    right: 16 * 0.87,
    top: 62 * 0.87,
  },
  tickIcon: {
    position: 'absolute' as 'absolute',
    right: 16 * 0.87,
    top: 60 * 0.87,
  },
  orLogIn: {
    marginTop: 22 * 0.87,
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
  },
  lineView: {
    borderStyle: 'solid' as 'solid',
    borderColor: '#d8dadc',
    borderTopWidth: 1 * 0.87,
    flex: 1,
    width: '100%' as '100%',
    height: 1 * 0.87,
  },
  orText: {
    color: 'rgba(0, 0, 0, 0.7)',
    fontSize: 14 * 0.87,
    lineHeight: 18 * 0.87,
    marginHorizontal: 10 * 0.87,
  },
  buttonBucket: {
    marginTop: 22 * 0.87,
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    gap: 15 * 0.87,
  },
  buttonWithIcon: {
    borderRadius: 10 * 0.87,
    backgroundColor: '#fff',
    borderStyle: 'solid' as 'solid',
    borderColor: '#d8dadc',
    borderWidth: 1 * 0.87,
    flex: 1,
    width: '100%' as '100%',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    paddingHorizontal: 45 * 0.87,
    paddingVertical: 18 * 0.87,
  },
  footer: {
    marginTop: 50 * 0.87,
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    gap: 5 * 0.87,
  },
};
