import { StyleSheet, View, FlatList, Text } from 'react-native';
import { useRouter } from 'expo-router';
import BackHeader from '@/components/BackHeader';
import { NewsCard } from '@/components/home/NewsCard';
import { NewsDetails } from '@/types/news';
import { Theme } from '@/constants/Theme';
import { useNews } from '@/hooks/news/useNews';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import { Feather } from '@expo/vector-icons';

const NewsTipsScreen = () => {
  const router = useRouter();
  const { data: news, isLoading } = useNews();

  const handleNewsPress = (news: NewsDetails) => {
    router.push({
      pathname: '/news-detail' as any,
      params: { news: JSON.stringify(news) },
    });
  };

  const renderNewsCard = ({ item }: { item: NewsDetails }) => (
    <View style={styles.newsCardContainer}>
      <NewsCard news={item} onPress={() => handleNewsPress(item)} />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <BackHeader title='News & Tips' />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading news...</Text>
        </View>
      </View>
    );
  }

  if (!news || news.length === 0) {
    return (
      <View style={styles.container}>
        <BackHeader title='News & Tips' />
        <View style={styles.emptyContainer}>
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
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackHeader title='News & Tips' />
      <FlatList
        data={news}
        renderItem={renderNewsCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.white,
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  newsCardContainer: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Theme.textInput,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default NewsTipsScreen;
