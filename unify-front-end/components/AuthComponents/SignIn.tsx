import React, { useState } from 'react';
import isExpoGo from '../../utils/isExpoGo';
import ForgotPassword from './ForgotPassword';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
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
import { SubmitButton, SimpleTextField } from './Components';
import { useAnalytics } from '@/utils/analytics';
import OTPPasswordReset from './OTPPasswordReset';
import { LEGAL_URLS } from '@/utils/legalUrls';

export function SignIn({
  onSwitchToSignUp,
  onBack,
}: {
  onSwitchToSignUp?: () => void;
  onBack?: () => void;
}): React.JSX.Element {
  const queryClient = useQueryClient();
  const {
    trackSignInCompleted,
    trackSignInFailed,
    trackGoogleSignInUsed,
    trackAppleSignInUsed,
  } = useAnalytics();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [isEmailValid, setIsEmailValid] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOTPReset, setShowOTPReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (emailInput: string) => {
    setIsEmailValid(emailRegex.test(emailInput.trim()));
  };

  const handleSignIn = async () => {
    setErrorMessage(null);
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setErrorMessage('Invalid login credentials');
      trackSignInFailed('empty_fields');
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      setErrorMessage('Invalid login credentials');
      trackSignInFailed('invalid_email');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });
    if (error) {
      setErrorMessage('Invalid login credentials');
      trackSignInFailed(error.code || 'signin_failed');
      setLoading(false);
      return;
    }

    if (data?.user?.id) {
      await queryClient.ensureQueryData({
        queryKey: ['userInfo', data.user.id],
        queryFn: () => getUserInfo(data.user.id),
      });
    }

    trackSignInCompleted();
    setLoading(false);
  };

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
        return;
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        {onBack && (
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={12}>
            <Ionicons name='chevron-back' size={24 * S} color='#000' />
          </Pressable>
        )}

        {/* Header */}
        <Text style={styles.header}>Sign in</Text>
        <View style={styles.subHeaderRow}>
          <Text style={styles.subHeaderText}>New user? </Text>
          <Text style={styles.subHeaderLink} onPress={onSwitchToSignUp}>
            Create an account
          </Text>
        </View>

        {/* Email field */}
        <View style={styles.fieldContainer}>
          <View style={styles.inputWithIconContainer}>
            <Ionicons
              name='mail-outline'
              size={20 * S}
              color='#999'
              style={styles.fieldLeftIcon}
            />
            <SimpleTextField
              value={email}
              onChangeText={text => {
                setEmail(text);
                validateEmail(text);
              }}
              placeholder='Email Address'
              placeholderTextColor='#999'
              style={[
                styles.textField,
                styles.textFieldWithLeftIcon,
                errorMessage && styles.textFieldError,
              ]}
              autoCapitalize='none'
              keyboardType='email-address'
            />
            {isEmailValid && (
              <MaterialIcons
                name='check-circle'
                size={20 * S}
                color='#333'
                style={styles.fieldRightIcon}
              />
            )}
          </View>
        </View>

        {/* Password field */}
        <View style={styles.fieldContainer}>
          <View style={styles.inputWithIconContainer}>
            <Ionicons
              name='lock-closed-outline'
              size={20 * S}
              color='#999'
              style={styles.fieldLeftIcon}
            />
            <SimpleTextField
              value={password}
              onChangeText={setPassword}
              placeholder='Password'
              placeholderTextColor='#999'
              style={[
                styles.textField,
                styles.textFieldWithLeftIcon,
                styles.textFieldWithRightIcon,
                errorMessage && styles.textFieldError,
              ]}
              secureTextEntry={!passwordVisible}
              autoCapitalize='none'
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.fieldRightIcon}
            >
              <MaterialIcons
                name={passwordVisible ? 'visibility' : 'visibility-off'}
                size={20 * S}
                color='#999'
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot password + error */}
        <View style={styles.forgotRow}>
          {errorMessage ? (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          ) : (
            <View />
          )}
          <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login button */}
        <SubmitButton
          loading={loading}
          onPress={handleSignIn}
          style={[styles.loginButton]}
          labelStyle={[styles.loginButtonText]}
        >
          Login
        </SubmitButton>

        {/* Or divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social icon buttons */}
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialIconButton}
            onPress={handleGoogleSignIn}
            accessibilityLabel='Sign in with Google'
            accessibilityRole='button'
          >
            <Google width={24 * S} height={24 * S} />
          </TouchableOpacity>
          {Platform.OS === 'ios' && !isExpoGo && (
            <TouchableOpacity
              style={styles.socialIconButton}
              onPress={handleAppleSignIn}
              accessibilityLabel='Sign in with Apple'
              accessibilityRole='button'
            >
              <Ionicons name='logo-apple' size={26 * S} color='#000' />
            </TouchableOpacity>
          )}
        </View>

        {/* Spacer to push legal text down */}
        <View style={styles.spacer} />

        {/* Legal text */}
        <Text style={styles.legalText}>
          By signing in with an account, you agree to Unify's{' '}
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL(LEGAL_URLS.termsOfService)}
          >
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL(LEGAL_URLS.privacyPolicy)}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Auth component scaling factor (0.87) — shared convention across all auth screens
// (SignIn, SignUp, ForgotPassword) to fit content on smaller devices.
const S = 0.87;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24 * S,
    paddingBottom: 24 * S,
  },
  backButton: {
    marginTop: 12 * S,
    alignSelf: 'flex-start',
  },
  header: {
    fontFamily: 'FunnelSans_600SemiBold',
    fontSize: 32 * S,
    color: '#000',
    marginTop: 48 * S,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6 * S,
    marginBottom: 32 * S,
  },
  subHeaderText: {
    fontFamily: 'FunnelSans_400Regular',
    fontSize: 15 * S,
    color: '#666',
  },
  subHeaderLink: {
    fontFamily: 'FunnelSans_600SemiBold',
    fontSize: 15 * S,
    color: '#000',
  },
  fieldContainer: {
    marginBottom: 14 * S,
  },
  inputWithIconContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  fieldLeftIcon: {
    position: 'absolute',
    left: 14 * S,
    top: 16 * S,
    zIndex: 1,
  },
  fieldRightIcon: {
    position: 'absolute',
    right: 14 * S,
    top: 16 * S,
    zIndex: 1,
  },
  textField: {
    backgroundColor: '#F5F5F5',
    color: '#000',
    borderColor: '#E8E8E8',
    borderWidth: 1 * S,
    borderRadius: 12 * S,
    padding: 14 * S,
    height: 52 * S,
    fontSize: 15 * S,
    fontFamily: 'FunnelSans_400Regular',
  },
  textFieldWithLeftIcon: {
    paddingLeft: 44 * S,
  },
  textFieldWithRightIcon: {
    paddingRight: 44 * S,
  },
  textFieldError: {
    borderColor: '#f00',
  },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24 * S,
  },
  errorMessage: {
    color: '#f00',
    fontSize: 13 * S,
    fontFamily: 'FunnelSans_400Regular',
    flex: 1,
    marginRight: 8 * S,
  },
  forgotText: {
    color: '#5182C7',
    fontSize: 14 * S,
    fontFamily: 'FunnelSans_400Regular',
  },
  loginButton: {
    backgroundColor: '#000',
    borderRadius: 40 * S,
    height: 52 * S,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18 * S,
    fontFamily: 'FunnelSans_600SemiBold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24 * S,
  },
  dividerLine: {
    flex: 1,
    height: 1 * S,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontFamily: 'FunnelSans_400Regular',
    color: '#999',
    fontSize: 14 * S,
    marginHorizontal: 16 * S,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16 * S,
  },
  socialIconButton: {
    width: 60 * S,
    height: 52 * S,
    borderRadius: 12 * S,
    borderWidth: 1 * S,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: 40 * S,
  },
  legalText: {
    fontFamily: 'FunnelSans_400Regular',
    fontSize: 12.5 * S,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18 * S,
    paddingHorizontal: 16 * S,
  },
  legalLink: {
    textDecorationLine: 'underline',
    color: '#666',
  },
});
