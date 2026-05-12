import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';

import { Theme } from '@/constants/Theme';

const CONFETTI = ['🎉', '✨', '🎊', '⭐', '🎁', '✨'];

interface ConfettiPiece {
  emoji: string;
  angle: number;
  distance: number;
  delay: number;
  duration: number;
  startScale: number;
}

const PIECES: ConfettiPiece[] = CONFETTI.map((emoji, i) => {
  // Spread the emojis around the badge in a roughly even arc, with a bit of
  // jitter so it doesn't look mechanical.
  const angle = (i / CONFETTI.length) * Math.PI * 2 + (i % 2 === 0 ? 0.2 : -0.3);
  return {
    emoji,
    angle,
    distance: 90 + (i % 3) * 18,
    delay: 60 + i * 40,
    duration: 900 + (i % 3) * 200,
    startScale: 0.6 + (i % 2) * 0.3,
  };
});

/**
 * SuccessCelebration — animated check badge with a one-shot confetti burst.
 * The badge scale-springs in; six emojis fly outward, rotate, and fade.
 * Plays once when the component mounts (e.g. when transitioning to the
 * success step).
 */
export function SuccessCelebration() {
  const badgeScale = useSharedValue(0);
  const badgeRotate = useSharedValue(-15);

  useEffect(() => {
    badgeScale.value = withDelay(
      120,
      withSpring(1, { damping: 9, stiffness: 130, mass: 0.7 })
    );
    badgeRotate.value = withDelay(
      120,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.back(1.3)) })
    );
  }, [badgeScale, badgeRotate]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: badgeScale.value },
      { rotate: `${badgeRotate.value}deg` },
    ],
  }));

  return (
    <View style={styles.wrap}>
      {PIECES.map((piece, idx) => (
        <ConfettiEmoji key={idx} piece={piece} />
      ))}
      <Animated.View style={[styles.badge, badgeStyle]}>
        <Check color={Theme.white} size={40} strokeWidth={3} />
      </Animated.View>
    </View>
  );
}

function ConfettiEmoji({ piece }: { piece: ConfettiPiece }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      piece.delay,
      withTiming(1, {
        duration: piece.duration,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [progress, piece.delay, piece.duration]);

  const style = useAnimatedStyle(() => {
    const tx = Math.cos(piece.angle) * piece.distance * progress.value;
    const ty = Math.sin(piece.angle) * piece.distance * progress.value;
    // Fade in fast, then fade out by the time it reaches the end of travel.
    const opacity =
      progress.value < 0.15
        ? progress.value / 0.15
        : Math.max(0, 1 - (progress.value - 0.55) / 0.45);
    const scale = piece.startScale + (1.1 - piece.startScale) * progress.value;
    const rotate = (progress.value * 240 * (piece.angle > Math.PI ? -1 : 1));
    return {
      opacity,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.confetti, style]}>
      <Text style={styles.confettiText}>{piece.emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiText: {
    fontSize: 22,
  },
});
