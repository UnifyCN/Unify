import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from '@/components/SkeletonLoader';

export const DailyTipCardSkeletonLoader = () => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <SkeletonLoader
          width={70}
          height={20}
          borderRadius={10}
          style={styles.skeleton}
        />
        <SkeletonLoader
          width={30}
          height={30}
          borderRadius={15}
          style={styles.skeleton}
        />
      </View>
      <View style={styles.content}>
        <SkeletonLoader
          width='80%'
          height={18}
          borderRadius={4}
          style={styles.titleSkeleton}
        />
        <SkeletonLoader
          width='95%'
          height={14}
          borderRadius={4}
          style={styles.skeleton}
        />
        <SkeletonLoader
          width='60%'
          height={14}
          borderRadius={4}
          style={styles.skeleton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 332,
    height: 132,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
  titleSkeleton: {
    backgroundColor: '#E0E0E0',
    marginBottom: 6,
  },
});
