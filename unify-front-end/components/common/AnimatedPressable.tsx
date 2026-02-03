import React, { useCallback, useEffect } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type AnimatedPressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  pressScale?: number;
  pressInDuration?: number;
  pressOutDuration?: number;
};

const AnimatedPressableComponent =
  Animated.createAnimatedComponent(Pressable);

const AnimatedPressable = ({
  style,
  pressScale = 0.985,
  pressInDuration = 110,
  pressOutDuration = 110,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: AnimatedPressableProps) => {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (disabled) {
      scale.value = 1;
    }
  }, [disabled, scale]);

  const handlePressIn = useCallback(
    (event: any) => {
      if (!reduceMotion && !disabled) {
        scale.value = withTiming(pressScale, {
          duration: pressInDuration,
          easing: Easing.out(Easing.ease),
        });
      }
      onPressIn?.(event);
    },
    [disabled, onPressIn, pressInDuration, pressScale, reduceMotion, scale]
  );

  const handlePressOut = useCallback(
    (event: any) => {
      if (!reduceMotion && !disabled) {
        scale.value = withTiming(1, {
          duration: pressOutDuration,
          easing: Easing.out(Easing.ease),
        });
      }
      onPressOut?.(event);
    },
    [disabled, onPressOut, pressOutDuration, reduceMotion, scale]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableComponent
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    />
  );
};

export default AnimatedPressable;
