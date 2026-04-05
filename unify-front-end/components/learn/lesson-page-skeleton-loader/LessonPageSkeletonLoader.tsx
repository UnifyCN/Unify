import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export default function LessonPageSkeletonLoader() {
  const pulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  const Skeleton = ({
    width,
    height,
    borderRadius = 8,
    style,
  }: {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: object;
  }) => (
    <Animated.View
      style={[styles.skeleton, { width, height, borderRadius, opacity }, style]}
    />
  );

  return (
    <View style={styles.safe}>
      <View style={styles.progressBarWrap}>
        <Skeleton width='92%' height={8} borderRadius={999} />
      </View>

      <View style={styles.content}>
        <Skeleton
          width='68%'
          height={34}
          borderRadius={10}
          style={styles.title}
        />

        <View style={styles.paragraphBlock}>
          <Skeleton width='100%' height={18} />
          <Skeleton width='94%' height={18} />
          <Skeleton width='89%' height={18} />
          <Skeleton width='96%' height={18} />
          <Skeleton width='70%' height={18} />
        </View>

        <View style={styles.paragraphBlock}>
          <Skeleton width='96%' height={18} />
          <Skeleton width='88%' height={18} />
          <Skeleton width='92%' height={18} />
        </View>
      </View>

      <View style={styles.bottomNav}>
        <Skeleton width='30%' height={44} borderRadius={22} />
        <Skeleton width='42%' height={44} borderRadius={22} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  progressBarWrap: {
    paddingTop: 22,
    paddingBottom: 14,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 23,
    paddingTop: 16,
  },
  title: {
    marginBottom: 24,
  },
  paragraphBlock: {
    gap: 12,
    marginBottom: 22,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 23,
    paddingVertical: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
});
