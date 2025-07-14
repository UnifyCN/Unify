import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
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
  onBackToSignUp,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [fullOtp, setFullOtp] = useState('');
  const hiddenInputRef = useRef<TextInput>(null);

  const handleFullOtpChange = (text: string) => {
    const digitsOnly = text.replace(/[^0-9]/g, '');

    const truncated = digitsOnly.slice(0, 6);
    setFullOtp(truncated);

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = truncated[i] || '';
    }
    setOtp(newOtp);
  };

  const handleBoxPress = () => {
    hiddenInputRef.current?.focus();
  };

  const handleVerify = async () => {
    const token = otp.join('');
    if (token.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const {
        data: { session },
        error: verifyError,
      } = await supabase.auth.verifyOtp({
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
            },
          },
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
        // clear the otp input after resending
        setOtp(['', '', '', '', '', '']);
        setFullOtp('');
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
        <Text style={styles.subtitle}>We've sent a verification code to</Text>
        <Text style={styles.emailText}>{email}</Text>

        {/* Hidden input for handling paste and continuous typing */}
        <TextInput
          ref={hiddenInputRef}
          value={fullOtp}
          onChangeText={handleFullOtpChange}
          style={styles.hiddenInput}
          keyboardType='number-pad'
          maxLength={6}
          autoFocus={true}
        />

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.otpBox, digit && styles.otpBoxFilled]}
              onPress={handleBoxPress}
              activeOpacity={0.7}
            >
              <Text style={styles.otpDigit}>{digit}</Text>
            </TouchableOpacity>
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
          <TouchableOpacity onPress={handleResendOTP} disabled={resendLoading}>
            <Text style={styles.resendLink}>
              {resendLoading ? 'Sending...' : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={onBackToSignUp}>
          <MaterialIcons name='arrow-back' size={20} color='#666' />
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
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32 * 0.87,
    paddingHorizontal: 20 * 0.87,
  },
  otpBox: {
    width: 45 * 0.87,
    height: 55 * 0.87,
    borderWidth: 1 * 0.87,
    borderColor: '#ccc',
    borderRadius: 8 * 0.87,
    backgroundColor: '#fff',
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  },
  otpBoxFilled: {
    borderColor: '#343434',
    backgroundColor: '#f8f8f8',
  },
  otpDigit: {
    fontSize: 20 * 0.87,
    fontWeight: '600' as '600',
    color: '#000',
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
