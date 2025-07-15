import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import onboardingSteps from './data/onboardingSteps';
import { OnboardingStep } from '../types/onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingProps {
  onFinish: () => void;
}

export default function Onboarding({ onFinish }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    onboardingSteps[0]
  );

  const endOnboarding = async () => {
    await AsyncStorage.setItem('onboardingCompleted', 'true');
    onFinish();
  };

  const onNext = async () => {
    const lastScreen = currentStep.stepNumber === onboardingSteps.length;

    if (lastScreen) {
      endOnboarding();
    } else {
      setCurrentStep(onboardingSteps[currentStep.stepNumber]);
    }
  };

  const onBack = () => {
    if (currentStep.stepNumber > 1) {
      setCurrentStep(onboardingSteps[currentStep.stepNumber - 2]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={endOnboarding}>
          <Text style={styles.skipButton}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <currentStep.graphic width={150} height={150} />
        <Text style={styles.title}>{currentStep.title}</Text>
        <Text style={styles.description}>{currentStep.description}</Text>
      </View>

      <View style={styles.navContainer}>
        {currentStep.stepNumber > 1 ? (
          <TouchableOpacity style={styles.navButtonContainer} onPress={onBack}>
            <Feather name='chevron-left' size={26} color='#343434' />
            <Text style={styles.navButton}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.navButtonContainer} />
        )}

        <TouchableOpacity style={styles.navButtonContainer} onPress={onNext}>
          <Text style={styles.navButton}>Next</Text>
          <Feather name='chevron-right' size={26} color='#343434' />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 20,
  },
  description: {
    fontSize: 18,
    color: '#5C5C5C',
    textAlign: 'center',
    marginTop: 20,
    width: '80%',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 30,
    paddingBottom: 50,
  },
  navButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    fontWeight: '600',
    color: '#343434',
    fontSize: 17,
  },
  skipContainer: {
    padding: 30,
    paddingTop: 50,
    alignItems: 'flex-end',
  },
  skipButton: {
    color: '#5C5C5C',
    fontSize: 17,
    marginTop: 20,
  },
});
