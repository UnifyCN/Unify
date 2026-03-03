import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal } from 'react-native';
import { CheckBox } from 'react-native-elements';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import isExpoGo from '../../utils/isExpoGo';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useQueryClient } from '@tanstack/react-query';
import { getUserInfo } from '@/services/users/getUserInfo';
import * as AppleAuthentication from 'expo-apple-authentication';
import Google from '../../assets/images/Google.svg';
import { createUserIfNotExists } from '../../utils/createUserIfNotExists';
import {
  SubmitButton,
  SimpleTextField,
  ViewHeader,
  ViewContainer,
  ViewSection,
} from './Components';
import { useAnalytics } from '@/utils/analytics';
import LegalWebView from '@/components/LegalWebView';
import { LEGAL_URLS, LEGAL_TITLES, LegalDocumentType } from '@/utils/legalUrls';

export function SignUp({
  onSwitchToSignIn,
  onShowOTP,
}: {
  onSwitchToSignIn?: () => void;
  onShowOTP?: (email: string, password: string, acceptedAt: string) => void;
}): React.JSX.Element {
  const queryClient = useQueryClient();
  const {
    trackSignUpStarted,
    trackSignUpCompleted,
    trackSignUpFailed,
    trackGoogleSignInUsed,
    trackAppleSignInUsed,
  } = useAnalytics();
  // State vars
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] =
    React.useState(false);
  const [isEmailValid, setIsEmailValid] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isChecked, setIsChecked] = React.useState(false);
  const [webViewDoc, setWebViewDoc] = useState<LegalDocumentType | null>(null);

  // Track sign up started on mount
  useEffect(() => {
    trackSignUpStarted();
  }, [trackSignUpStarted]);

  const validateEmail = (emailInput: string) => {
    // Simple email validation regex
    // Trim before testing to match handleSignUp behavior
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(emailInput.trim()));
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      trackSignUpFailed('passwords_mismatch');
      return;
    }

    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address');
      trackSignUpFailed('invalid_email');
      return;
    }

    if (!isChecked) {
      setErrorMessage(
        'Please accept the Terms of Service, Privacy Policy, and Community Guidelines'
      );
      trackSignUpFailed('terms_not_accepted');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Normalize email: trim whitespace and lowercase for consistency
      const normalizedEmail = email.trim().toLowerCase();

      // Check if email exists in the users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', normalizedEmail)
        .single();

      // Handle real database errors (not the expected "not found" error)
      if (checkError && checkError.code !== 'PGRST116') {
        setErrorMessage('Failed to verify email availability');
        trackSignUpFailed('email_check_failed');
        setLoading(false);
        return;
      }

      // PGRST116 means no user found (email is available), which is expected
      // If existingUser exists, email is already taken
      if (existingUser) {
        setErrorMessage('An account with this email already exists');
        trackSignUpFailed('email_already_exists');
        setLoading(false);
        return;
      }

      // If we get here, the email doesn't exist, so proceed with signup
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: password,
      });

      if (error) {
        setErrorMessage(error.message);
        trackSignUpFailed(error.code || 'signup_failed');
        setLoading(false);
        return;
      }

      // If successful, show OTP verification screen with acceptance timestamp
      trackSignUpCompleted();
      const acceptedAt = new Date().toISOString();
      onShowOTP?.(normalizedEmail, password, acceptedAt);
      // Early return to avoid calling setLoading(false) after component may have unmounted
      return;
    } catch (error) {
      setErrorMessage('An error occurred during sign up.');
      trackSignUpFailed('unknown_error');
      setLoading(false);
    }
  };

  // Configure Google Sign-In once on mount
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

  // Google sign-in logic
  const handleGoogleSignIn = async () => {
    if (isExpoGo) return; // Not supported in Expo Go

    setLoading(true);
    setErrorMessage(null);
    trackGoogleSignInUsed('sign_up');

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

        // Create user record if it doesn't exist (for Google sign-up users)
        if (data?.user?.id && data?.user?.email) {
          try {
            await createUserIfNotExists(data.user.id, data.user.email);
          } catch (userCreationError: any) {
            console.error('Failed to create user record:', userCreationError);
            setErrorMessage(
              userCreationError?.message || 'Failed to complete sign-up setup'
            );
            setLoading(false);
            return;
          }

          // Prefetch user info immediately after successful Google signup/login
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
    trackAppleSignInUsed('sign_up');

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
              userCreationError?.message || 'Failed to complete sign-up setup'
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
      setErrorMessage(error?.message || 'Apple sign-up failed');
    }
    setLoading(false);
  };

  return (
    <ViewContainer style={styles.container}>
      <ViewHeader style={styles.header}>Create account</ViewHeader>
      <ViewSection style={{ marginTop: 30 }}>
        <View style={{ position: 'relative' }}>
          <Text style={styles.label}>Email</Text>
          <SimpleTextField
            value={email}
            onChangeText={text => {
              setEmail(text);
              validateEmail(text);
            }}
            placeholder='Your email'
            style={[styles.textField, errorMessage && { borderColor: '#f00' }]}
            autoCapitalize='none'
          />
          {isEmailValid && (
            <MaterialIcons
              name='check-circle'
              size={24}
              color='black'
              style={styles.tickIcon}
            />
          )}
        </View>

        {/* Password field */}
        <View style={{ position: 'relative' }}>
          <Text style={styles.label}>Password</Text>
          <SimpleTextField
            value={password}
            onChangeText={setPassword}
            placeholder='Your password'
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

        {/* Confirm Password */}
        <View style={{ position: 'relative' }}>
          <Text style={styles.label}>Confirm Password</Text>
          <SimpleTextField
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder='Confirm Password'
            style={[styles.textField, errorMessage && { borderColor: '#f00' }]}
            secureTextEntry={!confirmPasswordVisible}
            autoCapitalize='none'
          />
          <TouchableOpacity
            onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
            style={styles.eyeIcon}
          >
            <MaterialIcons
              name={confirmPasswordVisible ? 'visibility' : 'visibility-off'}
              size={24}
              color='#333'
            />
          </TouchableOpacity>
        </View>
        {errorMessage && (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        )}
      </ViewSection>

      {/* Privacy Policy and Community Guidelines checkbox */}
      <View style={styles.checkboxRow}>
        <CheckBox
          checked={isChecked}
          onPress={() => setIsChecked(!isChecked)}
          containerStyle={styles.checkboxContainer}
          iconType='material-community'
          checkedIcon='checkbox-marked'
          uncheckedIcon='checkbox-blank-outline'
          checkedColor='black'
          uncheckedColor='black'
          wrapperStyle={styles.checkboxWrapper}
        />
        <Text style={styles.checkboxText}>
          I agree to the{' '}
          <Text
            style={styles.checkboxLinkText}
            onPress={() => setWebViewDoc('termsOfService')}
          >
            Terms of Service
          </Text>
          ,{' '}
          <Text
            style={styles.checkboxLinkText}
            onPress={() => setWebViewDoc('privacyPolicy')}
          >
            Privacy Policy
          </Text>
          {' & '}
          <Text
            style={styles.checkboxLinkText}
            onPress={() => setWebViewDoc('communityGuidelines')}
          >
            Community Guidelines
          </Text>
        </Text>
      </View>

      {/* Legal Document WebView Modal */}
      <Modal visible={webViewDoc !== null} animationType='slide'>
        {webViewDoc && (
          <LegalWebView
            url={LEGAL_URLS[webViewDoc]}
            title={LEGAL_TITLES[webViewDoc]}
            onClose={() => setWebViewDoc(null)}
          />
        )}
      </Modal>

      <SubmitButton
        disabled={!isEmailValid || !password || !confirmPassword || !isChecked}
        loading={loading}
        onPress={handleSignUp}
        style={[
          styles.button,
          (!isEmailValid || !password || !confirmPassword || !isChecked) &&
            styles.buttonDisabled,
        ]}
        labelStyle={[styles.buttonText]}
      >
        Sign Up
      </SubmitButton>

      <View style={styles.orSignUp}>
        <View style={styles.lineView}></View>
        <Text style={styles.orText}>Or Sign up with</Text>
        <View style={styles.lineView}></View>
      </View>
      <View style={styles.buttonBucket}>
        <TouchableOpacity
          style={styles.buttonWithIcon}
          onPress={handleGoogleSignIn}
        >
          <Google width={20} height={20} />
          <Text style={styles.oauthButtonText}>Sign up with Google</Text>
        </TouchableOpacity>
        {Platform.OS === 'ios' && !isExpoGo && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={10 * 0.87}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
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
          Already have an account?
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
          onPress={onSwitchToSignIn}
        >
          Log In
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
  footer: {
    marginTop: 50 * 0.87,
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    gap: 5 * 0.87,
  },
  // Terms and conditions checkbox style
  checkboxContainer: {
    backgroundColor: 'transparent' as 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
    marginVertical: 10 * 0.87,
    alignSelf: 'flex-start' as 'flex-start',
  },
  checkboxText: {
    fontSize: 16 * 0.87,
    color: '#000',
    marginLeft: 0 * 0.87,
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    alignSelf: 'flex-start' as 'flex-start',
    marginVertical: 10 * 0.87,
    marginLeft: 0,
    paddingLeft: 0,
  },
  checkboxLinkText: {
    fontSize: 16 * 0.87,
    color: '#5182C7', // Style the link text
    textDecorationLine: 'underline' as 'underline',
  },
  checkboxWrapper: {
    margin: 0, // Remove wrapper margin
    padding: 0, // Remove wrapper padding
  },
  buttonDisabled: {
    backgroundColor: '#E7E7E9',
  },
  orSignUp: {
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
    flexDirection: 'column' as 'column',
    gap: 12 * 0.87,
  },
  buttonWithIcon: {
    borderRadius: 10 * 0.87,
    backgroundColor: '#fff',
    borderStyle: 'solid' as 'solid',
    borderColor: '#d8dadc',
    borderWidth: 1 * 0.87,
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    height: 50 * 0.87,
    gap: 10 * 0.87,
  },
  oauthButtonText: {
    fontSize: 16 * 0.87,
    fontWeight: '500' as '500',
    color: '#000',
  },
  appleButton: {
    height: 50 * 0.87,
  },
};
