import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { NewsDetails } from '@/types/news';
import { Theme } from '@/constants/Theme';

interface NewsCardProps {
  news: NewsDetails;
  maxWidth?: number;
  onPress?: () => void;
}

export function NewsCard({ news, maxWidth, onPress }: NewsCardProps) {
  const { title, description, imageLink } = news;

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[
        styles.newsCard,
        maxWidth !== undefined
          ? { width: maxWidth }
          : { width: '100%', marginRight: 0 },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {imageLink ? (
        <Image
          source={{ uri: imageLink }}
          style={styles.newsImage}
          resizeMode='cover'
        />
      ) : (
        <View style={styles.newsImagePlaceholder} />
      )}
      <View style={styles.newsContent}>
        <Text style={styles.newsTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text
          style={styles.newsDescription}
          numberOfLines={2}
          ellipsizeMode='tail'
        >
          {description || ''}
        </Text>
      </View>
    </CardWrapper>
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
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  newsImagePlaceholder: {
    width: 100,
    height: 132,
    backgroundColor: Theme.imagePlaceholder,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  newsImage: {
    width: 100,
    height: 132,
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
