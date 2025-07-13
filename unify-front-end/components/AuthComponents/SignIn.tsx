import React from 'react';

import { useForm } from 'react-hook-form';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { SignInProps } from '@aws-amplify/ui-react-native';
import { supabase } from '../../lib/supabase';
import { Button } from 'react-native-paper';

import { MaterialIcons, SimpleLineIcons } from '@expo/vector-icons';
import Facebook from '../../assets/images/Facebook.svg';
import Google from '../../assets/images/Google.svg';
import Apple from '../../assets/images/Apple.svg';

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
            <MaterialIcons name='check-circle' size={24} color='#333' style={styles.tickIcon}/>
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
        disabled={!isEmailValid || !password}
        loading={loading}
        onPress={handleSignIn}
        style={[styles.button]}
        labelStyle={[styles.buttonText]}
      >
        Log in
      </SubmitButton>

      <LinksContainer>
        <LinkButton
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
        <View style={styles.buttonWithIcon}>
          <Facebook width={20} height={20} />
        </View>
        <View style={styles.buttonWithIcon}>
          <Apple width={20} height={20} />
        </View>
        <View style={styles.buttonWithIcon}>
          <Google width={20} height={20} />
        </View>
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
    color: 'black',
    textDecorationLine: 'underline' as 'underline',
  },
  linkText: {
    color: 'black',
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
