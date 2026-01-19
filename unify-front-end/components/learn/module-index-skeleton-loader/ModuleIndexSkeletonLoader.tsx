import React from 'react';
import { View, StyleSheet, Animated, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Constants matching the module index page
const TIMELINE_LEFT_WIDTH = 24;
const DOT_SIZE = 16;
const LINE_WIDTH = 2;

export function ModuleIndexSkeletonLoader() {
  const insets = useSafeAreaInsets();
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

  // Render skeleton section card
  const renderSkeletonSection = (index: number, isOpened = false) => {
    const isFirst = index === 0;
    const isLast = index === 4; // Show 5 sections

    return (
      <View key={index} style={styles.sectionRow}>
        {/* Left timeline column with lines and dot */}
        <View style={styles.timelineColumn}>
          {/* Main Part: Aligns with card content */}
          <View style={styles.timelineContent}>
            {/* Line above dot */}
            <View style={styles.lineHalf}>
              {!isFirst && <View style={[styles.lineSegment, { flex: 1 }]} />}
            </View>

            {/* Dot */}
            <View style={[styles.dot, isOpened && styles.dotActive]} />

            {/* Line below dot */}
            <View style={styles.lineHalf}>
              {!isLast && <View style={[styles.lineSegment, { flex: 1 }]} />}
            </View>
          </View>

          {/* Gap Extension Part: Extends line through the padding */}
          {!isLast && (
            <View style={styles.timelineGap}>
              <View style={[styles.lineSegment, { flex: 1 }]} />
            </View>
          )}
        </View>

        {/* Card */}
        <View
          style={[
            styles.card,
            isOpened && styles.cardOpened,
          ]}
        >
          <SkeletonBox
            width={isOpened ? '85%' : '75%'}
            height={16}
            style={{ marginBottom: 6 }}
          />
          <SkeletonBox
            width={isOpened ? '50%' : '40%'}
            height={14}
            style={{ marginBottom: isOpened ? 8 : 0 }}
          />

          {/* CTA Button skeleton - only show on opened card */}
          {isOpened && (
            <SkeletonBox width={80} height={30} borderRadius={16} />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Colored Header Skeleton */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {/* Blob background overlay skeleton */}
        <View style={styles.blobContainer}>
          <SkeletonBox width={400} height={400} borderRadius={200} />
        </View>

        <View style={styles.headerTopRow}>
          {/* Back button skeleton */}
          <SkeletonBox width={44} height={44} borderRadius={22} />
          
          {/* Icon container skeleton */}
          <SkeletonBox width={47} height={47} borderRadius={23.5} />
        </View>

        <View style={styles.headerTitleWrap}>
          {/* Title skeleton */}
          <SkeletonBox width={200} height={24} borderRadius={4} />
        </View>

        <View style={styles.headerDescriptionWrap}>
          {/* Description skeleton - 3 lines */}
          <SkeletonBox width="90%" height={16} borderRadius={4} style={{ marginBottom: 4 }} />
          <SkeletonBox width="85%" height={16} borderRadius={4} style={{ marginBottom: 4 }} />
          <SkeletonBox width="60%" height={16} borderRadius={4} />
        </View>
      </View>

      {/* Sections list with timeline */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {[0, 1, 2, 3, 4].map((index) => renderSkeletonSection(index, index === 1))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#D9D9D9', // Default gray for skeleton
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 15,
  },
  headerTitleWrap: {
    paddingHorizontal: 16,
    marginTop: 8,
    paddingLeft: 32, // Matches actual padding
  },
  headerDescriptionWrap: {
    paddingHorizontal: 16,
    marginTop: 4,
    paddingBottom: 4,
    paddingLeft: 32, // Matches actual padding
  },
  blobContainer: {
    position: 'absolute',
    top: -200,
    right: -200,
    width: 400,
    height: 400,
    overflow: 'hidden',
    transform: [{ rotate: '-45deg' }],
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingLeft: 16,
    paddingRight: 32,
  },

  // Section row
  sectionRow: {
    flexDirection: 'row',
    minHeight: 70,
    paddingBottom: 12, // Gap between cards
  },

  // Timeline column
  timelineColumn: {
    width: TIMELINE_LEFT_WIDTH,
    alignItems: 'center',
    flexDirection: 'column',
  },
  timelineContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  timelineGap: {
    height: 12,
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: -12,
  },
  lineHalf: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  lineSegment: {
    width: LINE_WIDTH,
    backgroundColor: '#D1D1D1',
  },

  // Dots
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#E5E5E5',
    borderWidth: 2,
    borderColor: '#D1D1D1',
  },
  dotActive: {
    backgroundColor: '#D9D9D9',
    borderColor: '#D9D9D9',
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginLeft: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardOpened: {
    backgroundColor: '#D9D9D9',
    borderColor: '#D9D9D9',
  },

  // Skeleton
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
});
