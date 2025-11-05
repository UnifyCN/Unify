import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckBox } from 'react-native-elements';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import Facebook from '../../assets/images/Facebook.svg';
import Google from '../../assets/images/Google.svg';
import Apple from '../../assets/images/Apple.svg';
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

  // Use the unified Google Auth hook
  const { signInWithGoogle } = useGoogleAuth();

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

  // Handle Google sign-in with unified hook
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    
    const result = await signInWithGoogle();
    
    if (!result.success && result.error) {
      setErrorMessage(result.error);
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
        Sign Up
      </SubmitButton>

      <View style={styles.orLogIn}>
        <View style={styles.lineView}></View>
        <Text style={styles.orText}>Or Sign up with</Text>
        <View style={styles.lineView}></View>
      </View>
      <View style={styles.buttonBucket}>
        <View style={styles.buttonWithIcon}>
          <Facebook width={20} height={20} />
        </View>
        <View style={styles.buttonWithIcon}>
          <Apple width={20} height={20} />
        </View>

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
    color: 'black' as 'black', // Style the link text
    textDecorationLine: 'underline' as 'underline',
  },
  checkboxWrapper: {
    margin: 0, // Remove wrapper margin
    padding: 0, // Remove wrapper padding
  },
  buttonDisabled: {
    backgroundColor: '#E7E7E9',
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
};
