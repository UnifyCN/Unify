import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ATTPrePromptScreen from '@/components/privacy/ATTPrePromptScreen';

// Allowlist guards against deep-link parameter abuse via the myapp:// scheme.
// Add new entries here when a new caller needs to route through ATT.
const ALLOWED_NEXT_PATHS = ['/welcome-from-inviter'];

const isAllowedNext = (next: unknown): next is string =>
  typeof next === 'string' && ALLOWED_NEXT_PATHS.includes(next);

export default function ATTPrePromptRoute() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();

  const handleComplete = () => {
    if (isAllowedNext(next)) {
      try {
        router.replace(next as any);
        return;
      } catch (err) {
        console.warn('[att-pre-prompt] router.replace failed; falling back', err);
      }
    }
    router.back();
  };

  return <ATTPrePromptScreen onComplete={handleComplete} />;
}
