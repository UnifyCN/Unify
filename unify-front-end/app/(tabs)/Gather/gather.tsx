import { memo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { EventsCarousel } from '@/components/EventsCarousel';
import Header from '@/components/Header';
import SearchButton from '@/components/SearchButton';
import { Theme } from '@/constants/Theme';
import { NewsCard } from '@/components/home/NewsCard';
import ViewMoreCardNews from '@/components/icons/ViewMoreCardNews.svg';

const NewsTipsSection = () => {
  const router = useRouter();

  const handleViewMore = () => {
    // TODO: Navigate to News & Tips screen when available
    // router.push('/(tabs)/NewsTipsScreen');
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.headerText}>News & Tips</Text>
        <Feather name='chevron-right' size={20} color='#666' />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: 20, paddingVertical: 2 }}
      >
        <NewsCard
          title='Navigating Winter Roads'
          description='New to snow? ICBC article to help you avoid issues on the icy, winter roads.'
        />
        <NewsCard
          title='Financial Planning Tips'
          description='Essential tips for managing your finances in Canada.'
        />
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
      </ScrollView>
    </View>
  );
};

const GatherHeader = memo(() => {
  const router = useRouter();

  const handleSearchPress = () => {
    router.push('/(tabs)/Gather/SearchScreen');
  };

  return (
    <View>
      <SearchButton 
        onPress={handleSearchPress}
        style={styles.searchButton}
        placeholderStyle={styles.searchPlaceholder}
        iconSize={20}
      />

      <View style={styles.eventsCarousel}>
        <EventsCarousel
          title='Community Events'
          titleStyle={styles.headerText}
        />
      </View>
    </View>
  );
});

export default function GatherScreen() {
  return (
    <View style={styles.root}>
      <Header />
      <View style={styles.container}>
        <StatusBar style='dark' />
        <ScrollView style={styles.scrollView}>
          <GatherHeader />
          <NewsTipsSection />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  searchButton: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 100,
    height: 36,
  },
  searchPlaceholder: {
    fontSize: 14,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '400',
  },
  eventsCarousel: {
    marginTop: 27,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    color: '#000',
    fontWeight: '600',
  },
  viewMoreCardContainer: {
    width: 332,
    height: 132,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
