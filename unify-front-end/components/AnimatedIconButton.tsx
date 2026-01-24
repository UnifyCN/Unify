import React, { useCallback } from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedIconButtonProps {
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function AnimatedIconButton({
  onPress,
  disabled = false,
  children,
  style,
}: AnimatedIconButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    // Trigger spring animation
    scale.value = withSequence(
      // Press down
      withTiming(0.75, { duration: 50 }),
      // Spring back with overshoot
      withSpring(1, {
        damping: 4,
        stiffness: 300,
        mass: 0.5,
      })
    );
    onPress();
  }, [onPress, scale]);

  return (
    <AnimatedTouchable
      onPress={handlePress}
      disabled={disabled}
      style={[style, animatedStyle]}
      activeOpacity={1}
    >
      {children}
    </AnimatedTouchable>
  );
}
