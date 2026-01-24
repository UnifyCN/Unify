import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AnimatedSplashProps {
  onAnimationComplete: () => void;
}

export default function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  const logoScale = useSharedValue(1);
  const logoOpacity = useSharedValue(1);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Sequence: pulse -> pause -> fade out
    logoScale.value = withSequence(
      // Pulse up
      withTiming(1.08, { duration: 300, easing: Easing.out(Easing.ease) }),
      // Pulse down
      withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) })
    );

    // After pulse, fade out
    logoOpacity.value = withDelay(
      600,
      withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) })
    );

    containerOpacity.value = withDelay(
      700,
      withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) }, (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      })
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <Animated.View style={logoAnimatedStyle}>
        <Image
          source={require('@/assets/images/splash-icon-light.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logo: {
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.4,
  },
});
