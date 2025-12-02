import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from '@/components/SkeletonLoader';

export function GroupCardSkeletonLoader() {
  return (
    <View style={styles.groupCard}>
      {/* Avatar skeleton */}
      <View style={styles.imageContainer}>
        <SkeletonLoader width={57} height={57} borderRadius={28.5} />
      </View>
      {/* Content skeleton */}
      <View style={styles.groupContent}>
        <SkeletonLoader width='70%' height={16} style={{ marginBottom: 8 }} />
        <SkeletonLoader width='100%' height={14} style={{ marginBottom: 4 }} />
        <SkeletonLoader width='85%' height={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    overflow: 'hidden',
    flexDirection: 'row',
    width: '100%',
    minHeight: 58,
    alignItems: 'flex-start',
  },
  imageContainer: {
    height: 58,
    width: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupContent: {
    paddingHorizontal: 12,
    flex: 1,
    justifyContent: 'flex-start',
  },
});
