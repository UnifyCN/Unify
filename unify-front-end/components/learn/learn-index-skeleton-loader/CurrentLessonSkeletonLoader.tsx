import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export function CurrentLessonSkeletonLoader() {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonBox = ({
    width,
    height,
    borderRadius = 0,
    style,
  }: {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: any;
  }) => (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );

  return (
    <View style={styles.card}>
      <View style={styles.banner}>
        <SkeletonBox width='100%' height={160} borderRadius={16} />
      </View>
      <View style={styles.footerRow}>
        <View style={styles.footerText}>
          <SkeletonBox width='60%' height={12} style={{ marginBottom: 8 }} />
          <SkeletonBox width='80%' height={16} />
        </View>
        <SkeletonBox width={38} height={38} borderRadius={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  banner: {
    marginHorizontal: -16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingRight: 15,
    paddingVertical: 8,
  },
  footerText: {
    flex: 1,
    paddingRight: 8,
  },
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
});
