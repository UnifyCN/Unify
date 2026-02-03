import React, { type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';

type Props = {
  children: ReactNode;
  basePaddingBottom?: number;
  keyboardGap?: number;
  style?: StyleProp<ViewStyle>;
};

const KeyboardSafeAreaView = ({
  children,
  basePaddingBottom = 0,
  keyboardGap = 0,
  style,
}: Props) => {
  const insets = useSafeAreaInsets();
  const { progress } = useReanimatedKeyboardAnimation();

  const animatedStyle = useAnimatedStyle(() => {
    const safeAreaPadding = interpolate(
      progress.value,
      [0, 1],
      [insets.bottom, 0],
      Extrapolate.CLAMP
    );

    return {
      paddingBottom: basePaddingBottom + keyboardGap + safeAreaPadding,
    };
  }, [basePaddingBottom, keyboardGap, insets.bottom]);

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
};

export default KeyboardSafeAreaView;
