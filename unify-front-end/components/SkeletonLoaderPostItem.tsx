import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

interface SkeletonLoaderPostItemProps {
  avatarSize?: number;
  showFooter?: boolean;
  variant?: 'default' | 'homeCard';
}

export const SkeletonLoaderPostItem = ({
  avatarSize = 40,
  showFooter = true,
  variant = 'default',
}: SkeletonLoaderPostItemProps) => {
  const isHomeCardVariant = variant === 'homeCard';

  return (
    <View
      style={[
        styles.container,
        isHomeCardVariant && styles.homeCardContainer,
      ]}
    >
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
        <View style={[styles.footer, isHomeCardVariant && styles.homeCardFooter]}>
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
  homeCardContainer: {
    borderBottomWidth: 0,
    borderWidth: 1,
    borderColor: '#EDEDED',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
  homeCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
    gap: 18,
  },
});
