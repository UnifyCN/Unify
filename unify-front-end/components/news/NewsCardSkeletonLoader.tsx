import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Theme } from '@/constants/Theme';

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
    backgroundColor: Theme.white,
    borderColor: Theme.borderCard,
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    marginRight: 16,
  },
  imagePlaceholder: {
    width: 100,
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: '#D5D5D5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    backgroundColor: Theme.white,
  },
  titleSkeleton: {
    marginBottom: 6,
    backgroundColor: '#D5D5D5',
  },
  descriptionSkeleton: {
    marginBottom: 4,
    backgroundColor: '#D5D5D5',
  },
});
