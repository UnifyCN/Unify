import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import {
  ViewHeader,
  ViewContainer,
  ViewSection,
  SubmitButton,
  SimpleTextField,
} from './Components';

interface OTPVerificationProps {
  email: string;
  password: string;
  onVerificationSuccess?: () => void;
  onBackToSignUp?: () => void;
}

export default function OTPVerification({ 
  email, 
  password, 
  onVerificationSuccess,
  onBackToSignUp 
}: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const handleChange = (index: number, value: string) => {
    if (/^\d$/.test(value) || value === '') {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        // This would require refs to implement auto-focus
      }
    }
  };
  // handle the otp length
  const handleVerify = async () => {
    const token = otp.join('');
    if (token.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {      
      const { data: { session }, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (verifyError) {
        setErrorMessage(verifyError.message);
        setLoading(false);
        return;
      }

      if (session) {
        // NOTE: just alert for now, until we have a UI designed for thos
        Alert.alert('Success', 'Email verified successfully!', [
          {
            text: 'OK',
            onPress: () => {
              onVerificationSuccess?.();
            }
          }
        ]);
      } else {
        setErrorMessage('Verification failed. Please try again.');
      }
    } catch (error) {
      setErrorMessage('An error occurred during verification.');
    }
    
    setLoading(false);
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        Alert.alert('Success', 'OTP resent successfully!');
      }
    } catch (error) {
      setErrorMessage('Failed to resend OTP.');
    }

    setResendLoading(false);
  };

  return (
    <ViewContainer style={styles.container}>
      <ViewHeader style={styles.header}>Verify Email</ViewHeader>
      
      <ViewSection style={{ marginTop: 30 }}>
        <Text style={styles.subtitle}>
          We've sent a verification code to
        </Text>
        <Text style={styles.emailText}>{email}</Text>
        
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              value={digit}
              onChangeText={(val) => handleChange(index, val)}
              keyboardType="number-pad"
              maxLength={1}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled
              ]}
              textAlign="center"
            />
          ))}
        </View>

        {errorMessage && (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        )}

        <SubmitButton
          disabled={otp.join('').length !== 6}
          loading={loading}
          onPress={handleVerify}
          style={[styles.verifyButton]}
          labelStyle={[styles.verifyButtonText]}
        >
          Verify Email
        </SubmitButton>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity 
            onPress={handleResendOTP}
            disabled={resendLoading}
          >
            <Text style={styles.resendLink}>
              {resendLoading ? 'Sending...' : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBackToSignUp}
        >
          <MaterialIcons name="arrow-back" size={20} color="#666" />
          <Text style={styles.backButtonText}>Back to Sign Up</Text>
        </TouchableOpacity>
      </ViewSection>
    </ViewContainer>
  );
}

const styles = StyleSheet.create({
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
  subtitle: {
    fontSize: 16 * 0.87,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8 * 0.87,
  },
  emailText: {
    fontSize: 16 * 0.87,
    fontWeight: '600' as '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 32 * 0.87,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32 * 0.87,
    paddingHorizontal: 20 * 0.87,
  },
  otpInput: {
    width: 45 * 0.87,
    height: 55 * 0.87,
    borderWidth: 1 * 0.87,
    borderColor: '#ccc',
    borderRadius: 8 * 0.87,
    fontSize: 20 * 0.87,
    fontWeight: '600' as '600',
    backgroundColor: '#fff',
  },
  otpInputFilled: {
    borderColor: '#343434',
    backgroundColor: '#f8f8f8',
  },
  errorMessage: {
    color: '#f00',
    fontSize: 14 * 0.87,
    textAlign: 'center',
    marginBottom: 16 * 0.87,
  },
  verifyButton: {
    backgroundColor: '#343434',
    borderRadius: 40 * 0.87,
    marginTop: 16 * 0.87,
    width: 200 * 0.87,
    height: 42 * 0.87,
    alignSelf: 'center' as 'center',
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  },
  verifyButtonText: {
    color: 'white',
    textAlign: 'center' as 'center',
    fontSize: 16 * 0.87,
    fontWeight: '600' as '600',
  },
  resendContainer: {
    flexDirection: 'row' as 'row',
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
    marginTop: 24 * 0.87,
  },
  resendText: {
    fontSize: 14 * 0.87,
    color: '#666',
  },
  resendLink: {
    fontSize: 14 * 0.87,
    color: '#343434',
    fontWeight: '600' as '600',
    textDecorationLine: 'underline' as 'underline',
  },
  backButton: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    marginTop: 32 * 0.87,
  },
  backButtonText: {
    fontSize: 14 * 0.87,
    color: '#666',
    marginLeft: 8 * 0.87,
  },
});
