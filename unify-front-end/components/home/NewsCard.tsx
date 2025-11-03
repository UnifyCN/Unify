import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NewsCardProps {
  title: string;
  description: string;
}

export function NewsCard({ title, description }: NewsCardProps) {
  return (
    <View style={styles.newsCard}>
      <View style={styles.newsImagePlaceholder} />
      <View style={styles.newsContent}>
        <Text style={styles.newsTitle}>{title}</Text>
        <Text style={styles.newsDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  newsCard: {
    width: 332,
    height: 132,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  newsImagePlaceholder: {
    width: 100,
    height: 132,
    backgroundColor: '#D3D3D3',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  newsContent: {
    flex: 1,
    height: 132,
    backgroundColor: '#FAFAFA',
    padding: 16,
    justifyContent: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    lineHeight: 22,
  },
  newsDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000',
    lineHeight: 20,
  },
});

