import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import OnboardingOne from '../assets/images/onboardingSvgOne.svg';
import OnboardingTwo from '../assets/images/onboardingSvgTwo.svg';
import OnboardingThree from '../assets/images/onboardingSvgThree.svg';

const onboardingSteps = [
  {
    graphic: OnboardingOne,
    title: 'Fostering Community',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.',
  },
  {
    graphic: OnboardingTwo,
    title: 'Empowering Learning',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.',
  },
  {
    graphic: OnboardingThree,
    title: 'Providing Resources',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.',
  },
];

export default function Onboarding({ route }: { route: { params: { setHasCompletedOnBoarding: React.Dispatch<React.SetStateAction<boolean>>} } }) {
  const [screenIndex, setScreenIndex] = useState(0);
  const router = useRouter();
  const data = onboardingSteps[screenIndex];
  const Graphic = data.graphic;

  const { setHasCompletedOnBoarding } = route.params;
  const endOnboarding = () => {
    setHasCompletedOnBoarding(true);
  };

  const onNext = () => {
    const lastScreen = screenIndex === onboardingSteps.length - 1;
    if (lastScreen) {
      endOnboarding();
    } else {
      setScreenIndex(screenIndex + 1);
    }
  };

  const onBack = () => {
    if (screenIndex > 0) {
      setScreenIndex(screenIndex - 1);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={endOnboarding}>
          <Text style={styles.skipButton}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <Graphic width={150} height={150} />
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.description}>{data.description}</Text>
      </View>

      <View style={styles.navContainer}>
        <TouchableOpacity style={styles.navButtonContainer} onPress={onBack}>
          <Feather name="chevron-left" size={26} color="#343434" />
          <Text style={styles.navButton}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButtonContainer} onPress={onNext}>
          <Text style={styles.navButton}>Next</Text>
          <Feather name="chevron-right" size={26} color="#343434" />
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