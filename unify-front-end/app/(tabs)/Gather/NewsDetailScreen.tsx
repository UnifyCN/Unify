import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import BackHeader from '@/components/BackHeader';
import { NewsDetails } from '@/types/news';
import { Theme } from '@/constants/Theme';

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

const NewsDetailScreen = () => {
  const { news } = useLocalSearchParams<{ news: string }>();

  let newsData: NewsDetails | null = null;
  try {
    newsData = news ? JSON.parse(news) : null;
  } catch (error) {
    console.error('Error parsing news data:', error);
  }

  if (!newsData) {
    return (
      <View style={styles.container}>
        <BackHeader title='' />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Article not found</Text>
        </View>
      </View>
    );
  }

  const { title, author, date, imageLink, content, description, link } =
    newsData;

  const handleLinkPress = () => {
    if (link) {
      Linking.openURL(link).catch(err =>
        console.error('Failed to open URL:', err)
      );
    }
  };

  return (
    <View style={styles.container}>
      <BackHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Article Title */}
        <Text style={styles.articleTitle}>{title}</Text>

        {/* Author and Date */}
        {(author || date) && (
          <Text style={styles.metadata}>
            {author && (
              <>
                by <Text style={styles.authorText}>{author}</Text>
              </>
            )}
            {author && date && ' on '}
            {date && formatDate(date)}
          </Text>
        )}

        {/* Article Image */}
        {imageLink ? (
          <Image
            source={{ uri: imageLink }}
            style={styles.articleImage}
            resizeMode='cover'
          />
        ) : (
          <View style={styles.articleImagePlaceholder} />
        )}

        {/* Article Content */}
        {description && (
          <Text style={styles.descriptionText}>{description}</Text>
        )}
        <View style={styles.divide} />
        {content && <Text style={styles.contentText}>{content}</Text>}
        {!description && !content && (
          <Text style={styles.contentText}>No content available.</Text>
        )}

        {/* Link to Original Article */}
        {link && (
          <TouchableOpacity
            onPress={handleLinkPress}
            style={styles.linkContainer}
          >
            <Text style={styles.linkText}>Link to external article</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.white,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  articleTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: Theme.black,
    marginBottom: 6,
    lineHeight: 36,
  },
  metadata: {
    fontSize: 14,
    color: Theme.black,
    marginBottom: 20,
    lineHeight: 20,
  },
  authorText: {
    fontSize: 16,
    fontWeight: '700',
  },
  articleImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#E0E0E0',
  },
  articleImagePlaceholder: {
    width: '100%',
    height: 161,
    borderRadius: 9.37,
    marginBottom: 20,
    backgroundColor: Theme.imagePlaceholder,
  },
  descriptionText: {
    fontSize: 18,
    color: Theme.black,
    lineHeight: 20,
    fontWeight: '600',
  },
  contentText: {
    fontSize: 18,
    color: Theme.black,
    lineHeight: 25,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  divide: {
    height: 1,
    backgroundColor: Theme.surfaceGray,
    marginVertical: 15,
  },
  linkContainer: {
    marginTop: 24,
    paddingBottom: 20,
  },
  linkText: {
    fontSize: 16,
    color: Theme.surfaceBlue,
    textDecorationLine: 'underline',
  },
});

export default NewsDetailScreen;
