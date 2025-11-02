import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export function CarouselDotsSkeletonLoader() {
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

  const SkeletonDot = ({ width, style }: { width: number; style?: any }) => (
    <Animated.View
      style={[
        styles.dot,
        {
          width,
          height: 10,
          borderRadius: 8,
          opacity,
        },
        style,
      ]}
    />
  );

  // Show one large dot (active) followed by 2 smaller dots (inactive)
  return (
    <View style={styles.container}>
      <SkeletonDot width={27} style={styles.itemSpacing} />
      <SkeletonDot width={10} style={styles.itemSpacing} />
      <SkeletonDot width={10} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    backgroundColor: '#E0E0E0',
  },
  itemSpacing: {
    marginHorizontal: 3,
  },
});

