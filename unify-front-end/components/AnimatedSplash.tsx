import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedSplashProps {
  isAppReady: boolean;
  onHidden: () => void;
  enableFadeOut?: boolean;
}

export default function AnimatedSplash({
  isAppReady,
  onHidden,
  enableFadeOut = true,
}: AnimatedSplashProps) {
  const reduceMotion = useReducedMotion();
  const [isExiting, setIsExiting] = useState(false);
  const hasHiddenRef = useRef(false);
  const mountedAtRef = useRef(Date.now());

  const logoScale = useSharedValue(0.96);
  const logoOpacity = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  const ENTER_DURATION = 240;
  const ROTATE_DURATION = 420;
  const HOLD_DURATION = 120;
  const EXIT_DURATION = 180;

  useEffect(() => {
    if (reduceMotion) {
      logoScale.value = 1;
      logoOpacity.value = 1;
      logoRotation.value = 0;
      return;
    }

    logoScale.value = withTiming(1, {
      duration: ENTER_DURATION,
      easing: Easing.out(Easing.ease),
    });
    logoOpacity.value = withTiming(1, {
      duration: ENTER_DURATION,
      easing: Easing.out(Easing.ease),
    });
    logoRotation.value = withTiming(360, {
      duration: ROTATE_DURATION,
      easing: Easing.out(Easing.ease),
    });
  }, [reduceMotion, logoOpacity, logoRotation, logoScale]);

  const triggerHide = () => {
    if (hasHiddenRef.current) return;
    hasHiddenRef.current = true;
    onHidden();
  };

  const startExit = () => {
    if (hasHiddenRef.current) return;
    if (reduceMotion || !enableFadeOut) {
      triggerHide();
      return;
    }

    setIsExiting(true);
    containerOpacity.value = withTiming(
      0,
      { duration: EXIT_DURATION, easing: Easing.out(Easing.ease) },
      finished => {
        if (finished) {
          runOnJS(triggerHide)();
        }
      }
    );
  };

  useEffect(() => {
    if (!isAppReady || hasHiddenRef.current) return;
    const elapsed = Date.now() - mountedAtRef.current;
    const minShowMs = Math.max(ENTER_DURATION, ROTATE_DURATION) + HOLD_DURATION;
    const remaining = Math.max(0, minShowMs - elapsed);
    const timeout = setTimeout(() => {
      startExit();
    }, remaining);

    return () => clearTimeout(timeout);
  }, [enableFadeOut, isAppReady, reduceMotion]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` },
    ],
    opacity: logoOpacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View
      style={[styles.container, containerAnimatedStyle]}
      pointerEvents={isExiting ? 'none' : 'auto'}
    >
      <Animated.View style={logoAnimatedStyle}>
        <Image
          source={require('@/assets/images/splash-icon-light.png')}
          style={styles.logo}
          resizeMode='contain'
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
