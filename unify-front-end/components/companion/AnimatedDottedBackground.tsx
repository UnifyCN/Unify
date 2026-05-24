import React, { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const PATH_D =
  'M-70.7674 -117.066C-14.2418 -145.804 105.95 -158.641 134.515 19.9159C170.22 243.112 37.3289 247.545 -32.076 217.539C-101.481 187.534 -90.998 114.692 -43.4538 98.2091C-11.2887 87.0578 7.00413 87.7949 79.4819 102.388C228.521 132.397 527.556 331.048 491.904 549.237C462.393 729.841 677.337 819.101 641.794 876.57';

// dash 12px, gap 18px → period 30. Animating strokeDashoffset from 0 to -30
// completes one full period, which looks identical to offset 0, so withRepeat
// can snap back to 0 without a visible seam.
const DASH_PATTERN = '12 18';
const DASH_PERIOD = 30;

interface Props {
  width: number;
  height: number;
  durationMs?: number;
}

export const AnimatedDottedBackground: React.FC<Props> = ({
  width,
  height,
  durationMs = 1800,
}) => {
  const offset = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (cancelled || reduceMotion) return;
      offset.value = withRepeat(
        withTiming(-DASH_PERIOD, {
          duration: durationMs,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    });
    return () => {
      cancelled = true;
      cancelAnimation(offset);
    };
  }, [durationMs, offset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  return (
    <Svg width={width} height={height} viewBox='0 0 392 635' fill='none'>
      <AnimatedPath
        d={PATH_D}
        stroke='#5182C7'
        strokeOpacity={0.35}
        strokeWidth={4}
        strokeDasharray={DASH_PATTERN}
        animatedProps={animatedProps}
      />
    </Svg>
  );
};
