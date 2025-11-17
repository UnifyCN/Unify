import React, { useState } from 'react';
import isExpoGo from '../../utils/isExpoGo'; // see if we are running dev env using expo go or not
import ForgotPassword from './ForgotPassword';
import { InputField } from './InputField';

import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Google from '../../assets/images/Google.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export function SignIn({
  onSwitchToSignUp,
}: {
  onSwitchToSignUp?: () => void;
}): React.JSX.Element {
  // State for email tick and password eye icon toggle
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [isEmailValid, setIsEmailValid] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const insets = useSafeAreaInsets();

  // Method to validate if email is in valid format for the tick icon to appear
  const validateEmail = (email: string) => {
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  };

  // Supabase sign in
  const handleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setErrorMessage(error.message);
    setLoading(false);
  };

  // Configure Google Sign-In once on mount (must happen BEFORE calling signIn)
  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '718278262223-f9pif0vn68o30v4ppskpllo6ka0hjvj2.apps.googleusercontent.com',
      scopes: ['email', 'profile'],
      offlineAccess: true,
      forceCodeForRefreshToken: false,
    });
  }, []);

  // Move Google sign-in logic to a separate function
  const handleGoogleSignIn = async () => {
    if (isExpoGo) return; // Not supported in Expo Go
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.data?.idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.data.idToken,
        });
        if (error) setErrorMessage(error.message);
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
        disabled={!isEmailValid || !password}
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
    color: 'black',
    marginTop: -14,
    textDecorationLine: 'underline' as 'underline',
  },
  linkText: {
    color: 'black',
    fontSize: 12,
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
