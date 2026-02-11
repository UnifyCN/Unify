import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { NewsCard } from '@/components/home/NewsCard';
import ViewMoreCardNews from '@/components/icons/ViewMoreCardNews.svg';
import { NewsDetails } from '@/types/news';
import { useNews } from '@/hooks/news/useNews';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import { Theme } from '@/constants/Theme';
import { HorizontalCarousel } from '@/components/HorizontalCarousel';
import { NewsCardSkeletonLoader } from '@/components/news/NewsCardSkeletonLoader';

export const NewsCarousel = () => {
  const router = useRouter();
  const { data: news, isLoading } = useNews();

  const handleViewMore = () => {
    router.push('/news-tips' as any);
  };

  const handleNewsPress = (newsItem: NewsDetails) => {
    router.push({
      pathname: '/news-detail' as any,
      params: { news: JSON.stringify(newsItem) },
    });
  };

  const newsArray = news || [];

  return (
    <View style={styles.newsSection}>
      <HorizontalCarousel
        title='News & Tips'
        titleStyle={styles.headerText}
        data={newsArray}
        isLoading={isLoading}
        maxItems={3}
        itemKeyExtractor={item => item.id}
        renderItem={item => (
          <NewsCard
            news={item}
            maxWidth={332}
            onPress={() => handleNewsPress(item)}
          />
        )}
        renderLoadingSkeleton={() => <NewsCardSkeletonLoader />}
        renderEmptyState={() => (
          <EmptyFeedMessage
            icon={<Feather name='file-text' size={24} color='#B4B1B1' />}
            message='No news available'
            submessage={
              <Text
                style={{
                  fontSize: 14,
                  color: Theme.textInput,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                Check back later for new articles
              </Text>
            }
          />
        )}
        renderViewMore={() => (
          <TouchableOpacity
            style={styles.viewMoreCardContainer}
            onPress={handleViewMore}
            activeOpacity={0.8}
          >
            <View style={styles.viewMoreContent}>
              <ViewMoreCardNews width={332} height={132} />
              <View style={styles.viewMoreTextOverlay}>
                <Text style={styles.viewMoreText}>
                  View more news{' '}
                  <Feather name='arrow-right' size={16} color='#000' />
                </Text>
                <Text style={styles.viewMoreSubtext}>
                  There's more to check out!
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        onViewMore={handleViewMore}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  newsSection: {
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
  },
  viewMoreCardContainer: {
    width: 332,
    height: 132,
    borderRadius: 16,
    borderColor: Theme.borderCard,
    borderWidth: 1,
    backgroundColor: Theme.white,
    overflow: 'hidden',
  },
  viewMoreContent: {
    width: 332,
    height: 132,
    position: 'relative',
  },
  viewMoreTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  viewMoreSubtext: {
    fontSize: 14,
    color: '#000',
  },
});
