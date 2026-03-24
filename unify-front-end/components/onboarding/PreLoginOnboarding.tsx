import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingPagination from './OnboardingPagination';
import BelongingScreen from './screens/BelongingScreen';
import ChecklistScreen from './screens/ChecklistScreen';
import CompanionScreen from './screens/CompanionScreen';
import LearnScreen from './screens/LearnScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TOTAL_STEPS = 4;

const SCREENS = [BelongingScreen, ChecklistScreen, CompanionScreen, LearnScreen];

interface PreLoginOnboardingProps {
  onFinish: () => void;
}

export default function PreLoginOnboarding({ onFinish }: PreLoginOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleFinish = useCallback(async () => {
    await AsyncStorage.setItem('onboardingCompleted', 'true');
    onFinish();
  }, [onFinish]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      scrollViewRef.current?.scrollTo({ x: prevStep * SCREEN_WIDTH, animated: true });
      setCurrentStep(prevStep);
    }
  }, [currentStep]);

  const handleContinue = useCallback(() => {
    if (currentStep === TOTAL_STEPS - 1) {
      handleFinish();
    } else {
      const nextStep = currentStep + 1;
      scrollViewRef.current?.scrollTo({ x: nextStep * SCREEN_WIDTH, animated: true });
      setCurrentStep(nextStep);
    }
  }, [currentStep, handleFinish]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const step = Math.round(offsetX / SCREEN_WIDTH);
      setCurrentStep(step);
    },
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header: Back + Skip */}
      <View style={styles.header}>
        {currentStep > 0 ? (
          <Pressable onPress={handleBack} hitSlop={12}>
            <Text style={styles.headerButtonText}>Back</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable onPress={handleFinish} hitSlop={12}>
          <Text style={styles.headerButtonText}>Skip</Text>
        </Pressable>
      </View>

      {/* Swipeable screens */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {SCREENS.map((ScreenComponent, index) => (
          <View key={index} style={styles.screenWrapper}>
            <ScreenComponent />
          </View>
        ))}
      </ScrollView>

      {/* Continue button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed,
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.continueText}>
            {currentStep === TOTAL_STEPS - 1 ? 'Start Now' : 'Continue'}
          </Text>
        </Pressable>

        {/* Pagination dots */}
        <View style={styles.paginationWrapper}>
          <OnboardingPagination totalSteps={TOTAL_STEPS} currentStep={currentStep} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: 8,
  },
  headerButtonText: {
    fontFamily: 'FunnelSans_400Regular',
    fontSize: 16,
    lineHeight: 20,
    color: '#535353',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  screenWrapper: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 38,
    paddingBottom: 20,
    gap: 16,
  },
  continueButton: {
    backgroundColor: '#000',
    height: 40,
    borderRadius: 12.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonPressed: {
    opacity: 0.85,
  },
  continueText: {
    fontFamily: 'FunnelSans_600SemiBold',
    fontSize: 17.5,
    lineHeight: 18,
    color: '#fff',
  },
  paginationWrapper: {
    alignItems: 'center',
  },
});
