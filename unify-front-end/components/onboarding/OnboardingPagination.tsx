import React from 'react';
import { View, StyleSheet } from 'react-native';

interface OnboardingPaginationProps {
  totalSteps: number;
  currentStep: number;
}

export default function OnboardingPagination({
  totalSteps,
  currentStep,
}: OnboardingPaginationProps) {
  return (
    <View
      style={styles.container}
      accessibilityLabel={`Step ${currentStep + 1} of ${totalSteps}`}
      accessibilityRole='progressbar'
      accessibilityValue={{ min: 1, max: totalSteps, now: currentStep + 1 }}
    >
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          accessible={false}
          style={[
            styles.dot,
            index === currentStep ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    height: 11,
    borderRadius: 50,
    backgroundColor: '#D9D9D9',
  },
  activeDot: {
    width: 34,
  },
  inactiveDot: {
    width: 12,
  },
});
