import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { createUserIfNotExists } from '../../utils/createUserIfNotExists';
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
  /** Timestamp when the user accepted legal documents during signup */
  legalAcceptedAt?: string;
  onVerificationSuccess?: () => void;
  onBackToSignUp?: () => void;
}

export default function OTPVerification({
  email,
  password,
  legalAcceptedAt,
  onVerificationSuccess,
  onBackToSignUp,
}: OTPVerificationProps) {
  const { t } = useTranslation();
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
      setErrorMessage(t('auth.otp.enterComplete'));
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
        // Create user record using shared helper
        if (!session.user.email) {
          setErrorMessage(t('auth.otp.unableRetrieveEmail'));
          setLoading(false);
          return;
        }

        try {
          await createUserIfNotExists(session.user.id, session.user.email, {
            privacyPolicyAcceptedAt: legalAcceptedAt,
            communityGuidelinesAcceptedAt: legalAcceptedAt,
          });
        } catch (userCreationError: any) {
          console.error('Failed to create user record:', userCreationError);
          setErrorMessage(
            userCreationError?.message || t('auth.otp.failedSetup')
          );
          setLoading(false);
          return;
        }

        // NOTE: just alert for now, until we have a UI designed for thos
        Alert.alert(t('auth.otp.successTitle'), t('auth.otp.successMessage'), [
          {
            text: t('common.ok'),
            onPress: () => {
              onVerificationSuccess?.();
            },
          },
        ]);
      } else {
        setErrorMessage(t('auth.otp.verificationFailed'));
      }
    } catch (error) {
      setErrorMessage(t('auth.otp.verificationError'));
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
        Alert.alert(t('auth.otp.successTitle'), t('auth.otp.otpResent'));
        // clear the otp input after resending
        setOtp(['', '', '', '', '', '']);
        setFullOtp('');
      }
    } catch (error) {
      setErrorMessage(t('auth.otp.otpResendFailed'));
    }

    setResendLoading(false);
  };

  return (
    <ViewContainer style={styles.container}>
      <ViewHeader style={styles.header}>{t('auth.otp.verifyEmail')}</ViewHeader>

      <ViewSection style={{ marginTop: 30 }}>
        <Text style={styles.subtitle}>{t('auth.otp.sentCodeTo')}</Text>
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
          {t('auth.otp.verifyEmail')}
        </SubmitButton>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>{t('auth.otp.didntReceive')}</Text>
          <TouchableOpacity onPress={handleResendOTP} disabled={resendLoading}>
            <Text style={styles.resendLink}>
              {resendLoading ? t('auth.otp.sending') : t('auth.otp.resend')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={onBackToSignUp}>
          <MaterialIcons name='arrow-back' size={20} color='#666' />
          <Text style={styles.backButtonText}>{t('auth.otp.backToSignUp')}</Text>
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
    height: 1,
    width: 1,
    top: -1000,
    left: -1000,
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
    color: '#5182C7',
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
