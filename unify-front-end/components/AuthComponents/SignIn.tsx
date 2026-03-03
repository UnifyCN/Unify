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
import { MaterialIcons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import Google from '../../assets/images/Google.svg';
import { useQueryClient } from '@tanstack/react-query';
import { getUserInfo } from '@/services/users/getUserInfo';
import { createUserIfNotExists } from '../../utils/createUserIfNotExists';
import {
  SubmitButton,
  ViewHeader,
  ViewContainer,
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
      setErrorMessage('Google sign-in failed. Please try again.');
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
      setErrorMessage('Apple sign-in failed. Please try again.');
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

      {/* OAuth buttons first — fastest path for most users */}
      <View style={styles.oauthSection}>
        <TouchableOpacity
          style={styles.buttonWithIcon}
          onPress={handleGoogleSignIn}
        >
          <Google width={20} height={20} />
          <Text style={styles.oauthButtonText}>Sign in with Google</Text>
        </TouchableOpacity>
        {Platform.OS === 'ios' && !isExpoGo && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={10 * 0.87}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        )}
      </View>

      <View style={styles.divider}>
        <View style={styles.lineView} />
        <Text style={styles.orText}>Or continue with email</Text>
        <View style={styles.lineView} />
      </View>

      {/* Email / password section */}
      <View>
        <View style={{ position: 'relative' }}>
          <Text style={styles.label}>Email Address</Text>
          <SimpleTextField
            value={email}
            onChangeText={text => {
              setEmail(text);
              validateEmail(text);
            }}
            placeholder='Email address'
            style={[styles.textField, errorMessage && styles.textFieldError]}
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
            placeholder='Password'
            style={[styles.textField, errorMessage && styles.textFieldError]}
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

        <View style={styles.passwordRow}>
          {errorMessage ? (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          ) : (
            <View />
          )}
          <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SubmitButton
        loading={loading}
        onPress={handleSignIn}
        style={[styles.button]}
        labelStyle={[styles.buttonText]}
      >
        Log in
      </SubmitButton>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <Text style={styles.footerLink} onPress={onSwitchToSignUp}>
          Sign up
        </Text>
      </View>
    </ViewContainer>
  );
}

const S = 0.87;

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16 * S,
    paddingLeft: 24 * S,
    paddingRight: 24 * S,
  },
  header: {
    fontSize: 34 * S,
    fontWeight: '700' as '700',
    color: '#000',
    marginBottom: 20 * S,
    marginTop: 90 * S,
  },
  // OAuth section — appears first
  oauthSection: {
    gap: 12 * S,
    marginBottom: 20 * S,
  },
  buttonWithIcon: {
    borderRadius: 10 * S,
    backgroundColor: '#fff',
    borderStyle: 'solid' as 'solid',
    borderColor: '#d8dadc',
    borderWidth: 1 * S,
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    height: 50 * S,
    gap: 10 * S,
  },
  oauthButtonText: {
    fontSize: 16 * S,
    fontWeight: '500' as '500',
    color: '#000',
  },
  appleButton: {
    height: 50 * S,
  },
  // Divider
  divider: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    marginBottom: 8 * S,
  },
  lineView: {
    borderColor: '#d8dadc',
    borderTopWidth: 1 * S,
    flex: 1,
    height: 1 * S,
  },
  orText: {
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 13 * S,
    lineHeight: 18 * S,
    marginHorizontal: 12 * S,
  },
  // Form fields
  label: {
    fontSize: 15 * S,
    fontWeight: '500' as '500',
    color: '#000',
    marginBottom: 6 * S,
    marginTop: 10 * S,
  },
  textField: {
    backgroundColor: '#fff',
    color: '#000',
    borderColor: '#ccc',
    borderWidth: 1 * S,
    borderRadius: 12 * S,
    padding: 8 * S,
    height: 50,
  },
  textFieldError: {
    borderColor: '#f00',
  },
  eyeIcon: {
    position: 'absolute' as 'absolute',
    right: 16 * S,
    top: 56 * S,
  },
  tickIcon: {
    position: 'absolute' as 'absolute',
    right: 16 * S,
    top: 54 * S,
  },
  // Password row: error left, forgot right
  passwordRow: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
    marginTop: 2 * S,
  },
  errorMessage: {
    color: '#f00',
    fontSize: 13 * S,
    flex: 1,
    marginRight: 8 * S,
  },
  forgotText: {
    color: '#5182C7',
    fontSize: 14 * S,
    fontWeight: '400' as '400',
  },
  // CTA
  button: {
    backgroundColor: '#343434',
    borderRadius: 40 * S,
    marginTop: 24 * S,
    height: 48 * S,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center' as 'center',
    fontSize: 16 * S,
    fontWeight: '600' as '600',
  },
  // Footer
  footer: {
    marginTop: 32 * S,
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    gap: 5 * S,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 18,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  footerLink: {
    fontSize: 14,
    lineHeight: 18,
    textDecorationLine: 'underline' as 'underline',
    fontWeight: '600' as '600',
    color: '#000',
  },
};
