import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Like_Fill from '@/assets/images/Like_filled.svg';

interface HeartBurst {
  id: number;
  x: number;
  y: number;
}

interface DoubleTapHeartProps {
  children: React.ReactNode;
  onDoubleTap: () => void;
  onSingleTap: () => void;
  enabled?: boolean;
}

const HEART_SIZE = 80;

function HeartAnimation({
  x,
  y,
  onComplete,
}: {
  x: number;
  y: number;
  onComplete: () => void;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 200, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 100 }),
      withDelay(
        200,
        withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) })
      )
    );
    opacity.value = withDelay(
      300,
      withTiming(0, { duration: 300 }, finished => {
        if (finished) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.heartContainer,
        { left: x - HEART_SIZE / 2, top: y - HEART_SIZE / 2 },
        animatedStyle,
      ]}
    >
      <Like_Fill width={HEART_SIZE} height={HEART_SIZE} />
    </Animated.View>
  );
}

export function DoubleTapHeart({
  children,
  onDoubleTap,
  onSingleTap,
  enabled = true,
}: DoubleTapHeartProps) {
  const [hearts, setHearts] = useState<HeartBurst[]>([]);
  let nextId = React.useRef(0);

  const showHeart = useCallback((x: number, y: number) => {
    const id = nextId.current++;
    setHearts(prev => [...prev, { id, x, y }]);
  }, []);

  const removeHeart = useCallback((id: number) => {
    setHearts(prev => prev.filter(h => h.id !== id));
  }, []);

  const handleDoubleTap = useCallback(
    (x: number, y: number) => {
      showHeart(x, y);
      onDoubleTap();
    },
    [onDoubleTap, showHeart]
  );

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(300)
    .onEnd((event) => {
      if (enabled) {
        runOnJS(handleDoubleTap)(event.x, event.y);
      }
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(300)
    .requireExternalGestureToFail(doubleTap)
    .onEnd(() => {
      runOnJS(onSingleTap)();
    });

  const composed = Gesture.Exclusive(doubleTap, singleTap);

  return (
    <GestureDetector gesture={composed}>
      <Animated.View>
        {children}
        {hearts.map(heart => (
          <HeartAnimation
            key={heart.id}
            x={heart.x}
            y={heart.y}
            onComplete={() => removeHeart(heart.id)}
          />
        ))}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  heartContainer: {
    position: 'absolute',
    width: HEART_SIZE,
    height: HEART_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
