import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
import Google from '../../assets/images/Google.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InputField } from './InputField';
import { Theme } from '@/constants/Theme';
import {
  SubmitButton,
  SimpleTextField,
  ViewHeader,
  ViewContainer,
  ViewSection,
} from './Components';

export function SignUp({
  onSwitchToSignIn,
  onShowOTP,
}: {
  onSwitchToSignIn?: () => void;
  onShowOTP?: (email: string, password: string) => void;
}): React.JSX.Element {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
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

  const validateEmail = (email: string) => {
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (!isChecked) {
      setErrorMessage('Please accept the terms and privacy policy');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Check if email exists in the users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      if (existingUser) {
        setErrorMessage('An account with this email already exists');
        setLoading(false);
        return;
      }

      // If we get here, the email doesn't exist, so proceed with signup
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      // If successful, show OTP verification screen
      onShowOTP?.(email, password);
    } catch (error) {
      setErrorMessage('An error occurred during sign up.');
    }

    setLoading(false);
  };

  // Configure Google Sign-In once on mount
  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '718278262223-f9pif0vn68o30v4ppskpllo6ka0hjvj2.apps.googleusercontent.com',
      scopes: ['email', 'profile'],
      offlineAccess: true,
      forceCodeForRefreshToken: false,
    });
  }, []);

  // Google sign-in logic
  const handleGoogleSignIn = async () => {
    if (isExpoGo) return; // Not supported in Expo Go
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.data?.idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.data.idToken,
        });
        if (error) {
          setErrorMessage(error.message);
          return;
        }

        // Prefetch user info immediately after successful Google signup/login and wait for it
        if (data?.user?.id) {
          await queryClient.ensureQueryData({
            queryKey: ['userInfo', data.user.id],
            queryFn: () => getUserInfo(data.user.id),
          });
        }
      } else {
        setErrorMessage('No Google idToken');
      }
    } catch (error: any) {
      if (error?.code === statusCodes.IN_PROGRESS) return; // already in progress
      if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErrorMessage('Google Play Services not available');
        return;
      }
      setErrorMessage(error?.message || 'Google sign-in failed');
    }
  };

  return (
    <ViewContainer style={styles.container}>
      <ViewHeader style={[styles.header, {paddingTop: insets.top + 90}]}>Create account</ViewHeader>
      <ViewSection style={{ marginTop: 30 }}>
        <InputField
          label='Email'
          value={email}
          onChangeText={text => {
            setEmail(text);
            validateEmail(text);
          }}
          placeholder='Your email'
          showValidIcon={isEmailValid}
          error={!!errorMessage}
        />
        <InputField
          label='Password'
          value={password}
          onChangeText={setPassword}
          placeholder='Your password'
          secureTextEntry
          showPasswordToggle
          passwordVisible={passwordVisible}
          onTogglePassword={() => setPasswordVisible(!passwordVisible)}
          error={!!errorMessage}
        />
        <InputField
          label='Confirm Password'
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder='Confirm Password'
          secureTextEntry
          showPasswordToggle
          passwordVisible={confirmPasswordVisible}
          onTogglePassword={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
          error={!!errorMessage}
        />
        {errorMessage && (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        )}
      </ViewSection>

      {/* Terms and conditions checkbox */}
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
          I accept the{' '}
          <Text
            style={styles.checkboxLinkText}
            onPress={() => {
              // Leave the link empty for now
            }}
          >
            terms and privacy policy
          </Text>
        </Text>
      </View>

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
        Create account
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
          Already have an account?
        </Text>
        <Text
          style={{
            fontSize: 14,
            lineHeight: 18,
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
  footer: {
    marginTop: 50,
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    gap: 5,
  },
  // Terms and conditions checkbox style
  checkboxContainer: {
    backgroundColor: 'transparent' as 'transparent',
    padding: 0,
    marginVertical: 0,
    marginLeft: 0,
    alignSelf: 'flex-start' as 'flex-start',
  },
  checkboxText: {
    fontSize: 14,
    color: '#000',
    marginLeft: 0,
  },
  checkboxRow: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    alignSelf: 'flex-start' as 'flex-start',
  },
  checkboxLinkText: {
    fontSize: 14,
    color: 'black' as 'black',
    textDecorationLine: 'underline' as 'underline',
  },
  checkboxWrapper: {
    margin: 0,
    padding: 0,
  },
  buttonDisabled: {
    backgroundColor: '#E7E7E9',
  },
  orSignUp: {
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
};
