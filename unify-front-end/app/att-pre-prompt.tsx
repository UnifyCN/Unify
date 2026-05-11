import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ATTPrePromptScreen from '@/components/privacy/ATTPrePromptScreen';

export default function ATTPrePromptRoute() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();

  const handleComplete = () => {
    if (next) {
      router.replace(next as any);
    } else {
      router.back();
    }
  };

  return <ATTPrePromptScreen onComplete={handleComplete} />;
}
