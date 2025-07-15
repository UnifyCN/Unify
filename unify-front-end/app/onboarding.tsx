import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import OnboardingOne from '../assets/images/onboardingSvgOne.svg';
import OnboardingTwo from '../assets/images/onboardingSvgTwo.svg';
import OnboardingThree from '../assets/images/onboardingSvgThree.svg';
import { OnboardingStep } from '../types/onboarding';

const onboardingSteps: OnboardingStep[] = [
  {
    graphic: OnboardingOne,
    title: 'Fostering Community',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.',
    stepNumber: 1,
  },
  {
    graphic: OnboardingTwo,
    title: 'Empowering Learning',
    title: 'Empowering Learning',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.',
    stepNumber: 2,
  },
  {
    graphic: OnboardingThree,
    title: 'Providing Resources',
    title: 'Providing Resources',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.',
    stepNumber: 3,
  },
];

export default function Onboarding({
  route,
}: {
  route: {
    params: {
      setHasCompletedOnBoarding: React.Dispatch<React.SetStateAction<boolean>>;
    };
  };
}) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    onboardingSteps[0]
  );

  // TODO: should probably store a bool in the user's profile or in a table instead of in the route params
  const { setHasCompletedOnBoarding } = route.params;
  const endOnboarding = () => {
    setHasCompletedOnBoarding(true);
  };

  const onNext = () => {
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
