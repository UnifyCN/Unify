import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SubmitButton, ViewContainer } from './Components';
import BackHeader from '../BackHeader';
import { InputField } from './InputField';
import { Theme } from '@/constants/Theme';
import VerifyResetCode from './VerifyResetCode';

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  // Method to validate if email is in valid format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  };

  // Show verification screen if OTP was sent
  if (showVerification) {
    return (
      <VerifyResetCode
        email={email}
        onBack={() => setShowVerification(false)}
      />
    );
  }

  const handleResetPassword = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'myapp://reset-password',
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        // Successfully sent OTP, show verification screen
        setShowVerification(true);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while sending reset email',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewContainer style={styles.container}>
      <BackHeader title='Forgot Password?' onBack={onBack} backIcon='chevron-left' />

      <View style={styles.content}>
        <Text style={styles.description}>
          Please enter your email to reset your password
        </Text>

        <InputField
          label='Email'
          value={email}
          onChangeText={text => {
            setEmail(text);
            validateEmail(text);
          }}
          placeholder='unify@gmail.com'
          showValidIcon={isEmailValid}
          error={message?.type === 'error'}
        />

        {message && (
          <Text
            style={[
              styles.message,
              message.type === 'error'
                ? styles.errorMessage
                : styles.successMessage,
            ]}
          >
            {message.text}
          </Text>
        )}

        <SubmitButton
          disabled={!isEmailValid}
          loading={loading}
          onPress={handleResetPassword}
          style={styles.button}
          labelStyle={styles.buttonText}
        >
          Send code
        </SubmitButton>
      </View>
    </ViewContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Theme.black,
    borderRadius: 10,
    marginTop: 32,
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#f00',
  },
  successMessage: {
    color: '#4CAF50',
  },
});
