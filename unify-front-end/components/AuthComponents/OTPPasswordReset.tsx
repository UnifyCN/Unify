import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SimpleTextField, SubmitButton, ViewContainer } from './Components';
import { MaterialIcons } from '@expo/vector-icons';
import BackHeader from '../BackHeader';

// Keeps auth form sizing aligned with existing sign-in/reset visual scale.
const SCALE_FACTOR = 0.87;

interface OTPPasswordResetProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function OTPPasswordReset({
  email,
  onBack,
  onSuccess,
}: Readonly<OTPPasswordResetProps>) {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState({
    otp: false,
    password: false,
    confirm: false,
  });
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const handleResetPassword = async () => {
    setLoading(true);
    setMessage(null);
    setFieldErrors({
      otp: false,
      password: false,
      confirm: false,
    });

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match',
      });
      setFieldErrors(prev => ({ ...prev, confirm: true }));
      setLoading(false);
      return;
    }

    // Verify password strength
    if (newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long.',
      });
      setFieldErrors(prev => ({ ...prev, password: true }));
      setLoading(false);
      return;
    }

    try {
      // Verify OTP for password reset
      const { error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery',
      });

      if (otpError) {
        setMessage({ type: 'error', text: otpError.message });
        setFieldErrors(prev => ({ ...prev, otp: true }));
        setLoading(false);
        return;
      }

      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setMessage({ type: 'error', text: updateError.message });
      } else {
        setMessage({
          type: 'success',
          text: 'Password has been reset successfully!',
        });

        if (successTimerRef.current) {
          clearTimeout(successTimerRef.current);
        }

        successTimerRef.current = setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error) {
      console.error(error);
      setMessage({
        type: 'error',
        text: 'An error occurred while resetting your password',
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
          Enter the 6-digit code sent to your email ({email}) to create your new
          password.
        </Text>

        <View>
          <Text style={styles.label}>Verification Code</Text>
          <SimpleTextField
            value={otp}
            onChangeText={text => {
              setOtp(text);
              setFieldErrors(prev => ({ ...prev, otp: false }));
            }}
            placeholder='Enter 6-digit code'
            style={[styles.textField, fieldErrors.otp && { borderColor: '#f00' }]}
            keyboardType='number-pad'
            maxLength={6}
            autoCapitalize='none'
          />
        </View>

        <View>
          <Text style={styles.label}>New Password</Text>
          <View style={{ position: 'relative' }}>
            <SimpleTextField
              value={newPassword}
              onChangeText={text => {
                setNewPassword(text);
                setFieldErrors(prev => ({ ...prev, password: false }));
              }}
              placeholder='New password'
              style={[
                styles.textField,
                fieldErrors.password && { borderColor: '#f00' },
              ]}
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
        </View>

        <View>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={{ position: 'relative' }}>
            <SimpleTextField
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
                setFieldErrors(prev => ({ ...prev, confirm: false }));
              }}
              placeholder='Confirm password'
              style={[
                styles.textField,
                fieldErrors.confirm && { borderColor: '#f00' },
              ]}
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
          disabled={
            !otp || !newPassword || !confirmPassword || otp.length !== 6
          }
          loading={loading}
          onPress={handleResetPassword}
          style={styles.button}
          labelStyle={styles.buttonText}
        >
          Reset Password
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
  label: {
    fontSize: 16 * SCALE_FACTOR,
    fontWeight: '400' as '400',
    color: '#000',
    marginBottom: 8 * SCALE_FACTOR,
    marginTop: 13 * SCALE_FACTOR,
  },
  textField: {
    backgroundColor: '#fff',
    color: '#000',
    borderColor: '#ccc',
    borderWidth: 1 * SCALE_FACTOR,
    borderRadius: 12 * SCALE_FACTOR,
    padding: 8 * SCALE_FACTOR,
    height: 57,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
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
    fontSize: 14 * SCALE_FACTOR,
    marginBottom: 16,
    textAlign: 'left',
  },
  errorMessage: {
    color: '#f00',
  },
  successMessage: {
    color: '#4CAF50',
  },
});
