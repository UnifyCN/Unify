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
    isText = false,
  }: {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: any;
    isText?: boolean;
  }) => (
    <Animated.View
      style={[
        isText ? styles.skeletonText : styles.skeleton,
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
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.skeleton, { opacity }]}
        />
        <View style={styles.bannerOverlay} />
        <View style={styles.bannerTextWrap}>
          <SkeletonBox
            width={120}
            height={12}
            style={{ marginBottom: 8 }}
            isText
          />
          <SkeletonBox width={200} height={18} isText />
        </View>
        <View style={styles.resumeButtonContainer}>
          <SkeletonBox width={101} height={36} borderRadius={8} isText />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    marginRight: 10,
    shadowColor: '#fff',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    overflow: 'hidden',
  },
  banner: {
    height: 160,
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 20,
    position: 'relative',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(153, 153, 153, 0.4)',
  },
  bannerTextWrap: {
    alignSelf: 'flex-start',
    position: 'relative',
    zIndex: 1,
  },
  resumeButtonContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 2,
  },
  skeleton: {
    backgroundColor: '#F5F5F5',
  },
  skeletonText: {
    backgroundColor: '#B0B0B0',
  },
});
