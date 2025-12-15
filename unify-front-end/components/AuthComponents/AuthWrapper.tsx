import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';
import OTPVerification from './OTPConfirmation';
import OnboardingQuiz from '../onboarding/OnboardingQuiz';
import { useOnboardingProfile } from '@/hooks/onboarding/useOnboardingProfile';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

  // Get onboarding profile for authenticated users
  const { data: onboardingProfile, isLoading: isLoadingOnboarding } =
    useOnboardingProfile(session?.user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Invalidate onboarding profile when auth state changes
      if (session?.user?.id) {
        queryClient.invalidateQueries({
          queryKey: ['onboardingProfile', session.user.id],
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const handleShowOTP = (email: string, password: string) => {
    setOtpEmail(email);
    setOtpPassword(password);
    setShowOTP(true);
  };

  const handleVerificationSuccess = () => {
    setShowOTP(false);
    setShowSignUp(false);
  };

  const handleBackToSignUp = () => {
    setShowOTP(false);
  };

  const handleOnboardingComplete = async () => {
    // Invalidate and wait for refetch to complete
    if (session?.user?.id) {
      await queryClient.invalidateQueries({
        queryKey: ['onboardingProfile', session.user.id],
      });
      // Refetch immediately to ensure we have the latest data
      await queryClient.refetchQueries({
        queryKey: ['onboardingProfile', session.user.id],
      });
    }
  };

  if (loading || (session && isLoadingOnboarding)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' />
      </View>
    );
  }

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

  // Check if onboarding is completed
  const isOnboardingCompleted =
    onboardingProfile?.onboarding_completed ?? false;

  // If authenticated but onboarding not completed, show onboarding quiz
  if (!isOnboardingCompleted) {
    return <OnboardingQuiz onComplete={handleOnboardingComplete} />;
  }

  // If authenticated and onboarding completed, show main app
  return <>{children}</>;
}
