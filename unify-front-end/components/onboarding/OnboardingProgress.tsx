import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  const insets = useSafeAreaInsets();
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={[styles.container, { paddingTop: 25 + insets.top }]}>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.stepText}>
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Theme.surfaceGray,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Theme.primaryGatherRed,
    borderRadius: 2,
  },
  stepText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.textInput,
    textAlign: 'center',
  },
});
