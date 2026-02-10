import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SimpleTextField, SubmitButton, ViewContainer } from './Components';
import { MaterialIcons } from '@expo/vector-icons';
import BackHeader from '../BackHeader';

interface ForgotPasswordProps {
  onBack: () => void;
  onCodeSent: (email: string) => void;
}

export default function ForgotPassword({
  onBack,
  onCodeSent,
}: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Use signInWithOtp instead for recovery
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false, // Don't create new users
        },
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({
          type: 'success',
          text: 'Check your email for a 6-digit code',
        });

        setTimeout(() => {
          onCodeSent(email);
        }, 1500);
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
      <BackHeader title='Reset Password' onBack={onBack} backIcon='x' />

      <View style={styles.content}>
        <Text style={styles.description}>
          Enter your email address and we'll send you a code to reset your password.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <View style={{ position: 'relative' }}>
            <SimpleTextField
              value={email}
              onChangeText={text => {
                setEmail(text);
                validateEmail(text);
              }}
              placeholder='Email address'
              style={[
                styles.textField,
                message?.type === 'error' && { borderColor: '#f00' },
              ]}
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
        </View>

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
          Send Reset Link
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
    padding: 24,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    marginTop: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
    marginBottom: 8,
  },
  textField: {
    backgroundColor: '#fff',
    color: '#000',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    height: 57,
  },
  tickIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  button: {
    backgroundColor: '#343434',
    borderRadius: 40,
    marginTop: 24,
    height: 42,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  message: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#f00',
  },
  successMessage: {
    color: '#4CAF50',
  },
});
