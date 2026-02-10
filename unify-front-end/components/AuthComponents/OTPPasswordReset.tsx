import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SimpleTextField, SubmitButton, ViewContainer } from './Components';
import { MaterialIcons } from '@expo/vector-icons';
import BackHeader from '../BackHeader';

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
  const [confirmPasswordVisible, setConfirmPasswordVisible] =
    React.useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const handleResetPassword = async () => {
    setLoading(true);
    setMessage(null);

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match',
      });
      setLoading(false);
      return;
    }

    // Verify password strength
    if (newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long.',
      });
      setLoading(false);
      return;
    }

    try {
      // Verify OTP for password reset
      const { error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (otpError) {
        setMessage({ type: 'error', text: otpError.message });
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

        setTimeout(() => {
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
            onChangeText={setOtp}
            placeholder='Enter 6-digit code'
            style={[
              styles.textField,
              message?.type === 'error' && { borderColor: '#f00' },
            ]}
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
              onChangeText={setNewPassword}
              placeholder='New password'
              style={[
                styles.textField,
                message?.type === 'error' && { borderColor: '#f00' },
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
              onChangeText={setConfirmPassword}
              placeholder='Confirm password'
              style={[
                styles.textField,
                message?.type === 'error' && { borderColor: '#f00' },
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
    fontSize: 16 * 0.87,
    fontWeight: '400' as '400',
    color: '#000',
    marginBottom: 8 * 0.87,
    marginTop: 13 * 0.87,
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
    fontSize: 14 * 0.87,
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
