import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from '@/components/SkeletonLoader';

export const NewsCardSkeletonLoader = () => {
  return (
    <View style={styles.newsCard}>
      <SkeletonLoader
        width={100}
        height={132}
        borderRadius={12}
        style={styles.imagePlaceholder}
      />
      <View style={styles.content}>
        <SkeletonLoader
          width='85%'
          height={20}
          borderRadius={4}
          style={styles.titleSkeleton}
        />
        <SkeletonLoader
          width='100%'
          height={16}
          borderRadius={4}
          style={styles.descriptionSkeleton}
        />
        <SkeletonLoader
          width='70%'
          height={16}
          borderRadius={4}
          style={styles.descriptionSkeleton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  newsCard: {
    width: 332,
    height: 132,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    marginRight: 16,
  },
  imagePlaceholder: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: '#D5D5D5',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  titleSkeleton: {
    marginBottom: 8,
    backgroundColor: '#D5D5D5',
  },
  descriptionSkeleton: {
    marginBottom: 4,
    backgroundColor: '#D5D5D5',
  },
});
