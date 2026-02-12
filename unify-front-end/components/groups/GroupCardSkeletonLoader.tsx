import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Theme } from '@/constants/Theme';

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
    backgroundColor: Theme.white,
    borderColor: Theme.borderCard,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    width: '100%',
    minHeight: 82,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  imageContainer: {
    height: 57,
    width: 57,
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  groupContent: {
    flex: 1,
    justifyContent: 'center',
  },
});
