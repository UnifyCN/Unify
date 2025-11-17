import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SubmitButton, ViewContainer, SimpleTextField } from './Components';
import BackHeader from '../BackHeader';
import { Theme } from '@/constants/Theme';
import { useRouter } from 'expo-router';

interface VerifyResetCodeProps {
  onBack: () => void;
  email: string;
}

export default function VerifyResetCode({ onBack, email }: VerifyResetCodeProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleVerifyCode = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // Verify the OTP code
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery',
      });

      if (error) {
        setErrorMessage('Reset code is incorrect.');
      } else if (data?.session) {
        // Successfully verified, navigate to reset password screen
        router.push('/reset-password');
      }
    } catch (error) {
      setErrorMessage('An error occurred while verifying the code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewContainer style={styles.container}>
      <BackHeader title='' onBack={onBack} backIcon='chevron-left' />

      <View style={styles.content}>
        <Text style={styles.heading}>Check your email</Text>
        <Text style={styles.description}>
          We sent codes to your email. Enter the received code to confirm your account.
        </Text>

        <View>
          <Text style={styles.label}>Code</Text>
          <SimpleTextField
            value={code}
            onChangeText={setCode}
            placeholder='439932'
            style={[
              styles.textField,
              errorMessage && styles.textFieldError,
            ]}
            keyboardType='number-pad'
            maxLength={6}
          />
        </View>

        {errorMessage && (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        )}

        <SubmitButton
          disabled={code.length < 6}
          loading={loading}
          onPress={handleVerifyCode}
          style={styles.button}
          labelStyle={styles.buttonText}
        >
          Confirm
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
    paddingTop: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000',
    marginBottom: 6,
  },
  textField: {
    backgroundColor: '#fff',
    color: '#000',
    borderColor: '#ccc',
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    letterSpacing: 2,
  },
  textFieldError: {
    borderColor: '#f00',
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
  errorMessage: {
    color: '#f00',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
});
