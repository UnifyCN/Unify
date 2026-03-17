import React, { useEffect } from 'react';
import { StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface AnimatedSplashProps {
  onAnimationComplete: () => void;
}

export default function AnimatedSplash({
  onAnimationComplete,
}: AnimatedSplashProps) {
  const rotation = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Spin 360deg with linear ease
    rotation.value = withTiming(360, {
      duration: 800,
      easing: Easing.linear,
    });

    // Fade out the whole container after spin
    containerOpacity.value = withDelay(
      900,
      withTiming(
        0,
        { duration: 300, easing: Easing.out(Easing.ease) },
        (finished) => {
          if (finished) {
            runOnJS(onAnimationComplete)();
          }
        }
      )
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
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
    width: 200,
    height: 200,
  },
});
