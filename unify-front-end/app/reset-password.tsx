import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import {
  SimpleTextField,
  SubmitButton,
  ViewContainer,
} from '@/components/AuthComponents/Components';
import { MaterialIcons } from '@expo/vector-icons';
import BackHeader from '@/components/BackHeader';
import { useRouter } from 'expo-router';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const validatePassword = (password: string) => {
    return password.length >= 8; // Can add more complex validation if needed
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setMessage(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    // Validate password strength
    if (!validatePassword(newPassword)) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters long',
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({
          type: 'success',
          text: 'Password has been reset successfully',
        });
        // Redirect to sign in after a short delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (error) {
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
      <BackHeader
        title='Reset Password'
        onBack={() => router.back()}
        backIcon='x'
      />

      <View style={styles.content}>
        <Text style={styles.description}>Enter your new password below.</Text>

        <View style={styles.inputContainer}>
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

        <View style={styles.inputContainer}>
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
              secureTextEntry={!passwordVisible}
              autoCapitalize='none'
            />
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
          disabled={!newPassword || !confirmPassword}
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
