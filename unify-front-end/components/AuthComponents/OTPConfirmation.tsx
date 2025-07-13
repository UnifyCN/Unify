import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '@/lib/supabase'; // adjust path based on your project

export default function OTPVerification({ email }: { email: string }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handleChange = (index: number, value: string) => {
    if (/^\d$/.test(value) || value === '') {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
    }
  };

  const handleVerify = async () => {
    const token = otp.join('');
    const { data: { session }, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      Alert.alert('Verification failed', error.message);
    } else {
      Alert.alert('Success', 'Logged in!');
      // TODO: Navigate to home screen or store session
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter OTP</Text>
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            value={digit}
            onChangeText={(val) => handleChange(index, val)}
            keyboardType="number-pad"
            maxLength={1}
            style={styles.otpInput}
          />
        ))}
      </View>

      <TouchableOpacity onPress={handleVerify} style={styles.verifyButton}>
        <Text style={styles.verifyText}>Verify</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.resend}>Send Again</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.cancel}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#d63677',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  otpInput: {
    borderBottomWidth: 2,
    borderColor: '#ccc',
    width: 40,
    fontSize: 20,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#ff3370',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginBottom: 16,
  },
  verifyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resend: {
    color: '#ff3370',
    textDecorationLine: 'underline',
    marginBottom: 12,
  },
  cancel: {
    color: '#888',
  },
});
