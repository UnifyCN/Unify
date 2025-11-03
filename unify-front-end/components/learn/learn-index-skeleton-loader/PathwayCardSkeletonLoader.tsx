import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export function PathwayCardSkeletonLoader() {
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
    <View style={styles.card}>
      <View style={styles.banner}>
        <SkeletonBox width="100%" height={100} borderRadius={20} />
      </View>
      <SkeletonBox width="80%" height={16} style={{ marginBottom: 6 }} />
      <SkeletonBox width="60%" height={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    paddingTop: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    shadowColor: '#575757',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  banner: {
    height: 100,
    marginHorizontal: -12,
    backgroundColor: '#d9d9d9',
    marginBottom: 12,
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
});

