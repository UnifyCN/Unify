import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export function LearnProgressCardSkeletonLoader() {
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

  const SkeletonBox = ({ width, height, borderRadius = 0, style }: {
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
    <View style={styles.progressCard}>
      {/* Text skeleton */}
      <SkeletonBox width="85%" height={22} style={{ marginBottom: 16 }} />
      <SkeletonBox width="40%" height={18} style={{ marginBottom: 8 }} />
      
      {/* Progress bar skeleton */}
      <View style={styles.cardProgressBar}>
        <SkeletonBox width="60%" height={11} borderRadius={20} />
      </View>

      {/* Button skeleton */}
      <SkeletonBox width="100%" height={44} borderRadius={8} style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardProgressBar: {
    height: 11,
    backgroundColor: '#E5E5E5',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
});

