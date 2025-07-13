import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';
import OTPVerification from './OTPConfirmation';

type Props = {
  children: React.ReactNode;
};

export default function AuthWrapper({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPassword, setOtpPassword] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleShowOTP = (email: string, password: string) => {
    console.log('Showing OTP screen for:', email);
    setOtpEmail(email);
    setOtpPassword(password);
    setShowOTP(true);
  };

  const handleVerificationSuccess = () => {
    console.log('OTP verification successful, hiding OTP screen');
    setShowOTP(false);
    setShowSignUp(false);
    // User is now authenticated and session will be updated
  };

  const handleBackToSignUp = () => {
    console.log('User going back to signup');
    setShowOTP(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  console.log(session);
  
  if (!session) {
    if (showOTP) {
      return (
        <OTPVerification
          email={otpEmail}
          password={otpPassword}
          onVerificationSuccess={handleVerificationSuccess}
          onBackToSignUp={handleBackToSignUp}
        />
      );
    }
    
    return showSignUp ? (
      <SignUp 
        onSwitchToSignIn={() => setShowSignUp(false)} 
        onShowOTP={handleShowOTP}
      />
    ) : (
      <SignIn onSwitchToSignUp={() => setShowSignUp(true)} />
    );
  }

  return <>{children}</>;
}
