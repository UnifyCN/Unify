import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

interface SkeletonLoaderPostItemProps {
  avatarSize?: number;
  showFooter?: boolean;
}

export const SkeletonLoaderPostItem: React.FC<SkeletonLoaderPostItemProps> = ({
  avatarSize = 40,
  showFooter = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonLoader
          width={avatarSize}
          height={avatarSize}
          borderRadius={avatarSize / 2}
        />
        <View style={styles.content}>
          <SkeletonLoader width='40%' height={16} style={{ marginBottom: 4 }} />
          <SkeletonLoader width='20%' height={12} />
        </View>
      </View>
      <SkeletonLoader width='100%' height={20} style={{ marginVertical: 8 }} />
      <SkeletonLoader width='90%' height={16} style={{ marginBottom: 4 }} />
      <SkeletonLoader width='70%' height={16} style={{ marginBottom: 12 }} />
      {showFooter && (
        <View style={styles.footer}>
          <SkeletonLoader width={60} height={16} />
          <SkeletonLoader width={40} height={16} />
          <SkeletonLoader width={30} height={16} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  content: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
});
