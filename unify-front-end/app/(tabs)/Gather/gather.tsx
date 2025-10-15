import { useState, memo, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useScrollContext } from '@/context/ScrollContext';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ForYouFeed from '@/components/home/ForYouFeed';
import FollowingFeed from '@/components/home/FollowingFeed';
import GroupsFeed from '@/components/home/GroupsFeed';
import { Feather } from '@expo/vector-icons';
import { useEvents } from '@/hooks/events/useEvents';
import EventCard from './EventCard';
import ViewMoreCard from './ViewMoreCard';
import CreatePostButton from '@/components/posts/CreatePostButton';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';

const SCROLL_DISTANCE = 200;

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const GatherHeader = memo(() => {
  const router = useRouter();

  const { data: events, isLoading } = useEvents();

  const displayEvents = events?.slice(0, 3) || [];

  return (
    <View>
      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.searchInputContainer}
          onPress={() => router.push('/(tabs)/Gather/SearchScreen')}
        >
          <Feather
            name='search'
            size={24}
            color='#666'
            style={styles.searchIcon}
          />
          <Text style={[styles.searchInput, { color: '#999' }]}>
            Search for groups near you or related posts
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerText}>Gather Events</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/Gather/EventsScreen')}
        >
          <Feather name='chevron-right' size={24} color='#000' />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.eventsCarousel}
        contentContainerStyle={[
          styles.eventsCarouselContent,
          events && events.length === 0 && styles.eventsCarouselContentEmpty,
        ]}
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color='#000' />
          </View>
        )}
        {!isLoading && events && events.length === 0 && (
          <View style={styles.emptyEventsContainer}>
            <Text style={styles.emptyEventsText}>No events available</Text>
            <Text style={styles.emptyEventsSubtext}>
              Check back later for new events
            </Text>
          </View>
        )}
        {displayEvents.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/Gather/EventDetailScreen',
                params: { event: JSON.stringify(event) },
              })
            }
          />
        ))}
        {events && events.length > 3 && (
          <ViewMoreCard
            onPress={() => router.push('/(tabs)/Gather/EventsScreen')}
          />
        )}
      </ScrollView>

      <Text
        style={{
          fontWeight: 600,
          fontSize: 24,
          color: 'black',
          paddingHorizontal: 20,
          marginTop: 20,
        }}
      >
        Your Feed
      </Text>
    </View>
  );
});

const FeedTabs = memo(({ activeTab, setActiveTab }: HeaderProps) => {
  return (
    <View style={styles.tabs}>
      {['For You', 'Following', 'Groups'].map(tab => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
        >
          <Text
            style={[styles.tabText, activeTab === tab && styles.activeTabText]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});

export default function GatherScreen() {
  const [activeTab, setActiveTab] = useState('For You');

  const renderFeedContent = useMemo(() => {
    switch (activeTab) {
      case 'Following':
        return (
          <FollowingFeed
            key={`following-${activeTab}`}
            ListEmptyComponent={
              <EmptyFeedMessage
                message='No one you follow has posted anything yet'
                submessage='Follow other users to see their posts here'
              />
            }
          />
        );
      case 'Groups':
        return (
          <GroupsFeed
            key={`groups-${activeTab}`}
            ListEmptyComponent={
              <EmptyFeedMessage
                message='No posts in any of your groups yet'
                submessage='Join a group to see their posts here'
              />
            }
          />
        );
      default:
        return (
          <ForYouFeed
            key={`foryou-${activeTab}`}
            ListEmptyComponent={
              <EmptyFeedMessage
                message='No one has posted anything yet'
                submessage='No posts for you to see'
              />
            }
          />
        );
    }
  }, [activeTab]);

  // Easiest way to make the header sticky
  const data = [
    { key: 'header', type: 'header' },
    { key: 'tabs', type: 'tabs' },
    { key: 'feed', type: 'feed' },
  ];

  const renderItem = ({ item }: { item: { key: string; type: string } }) => {
    switch (item.type) {
      case 'header':
        return <GatherHeader />;
      case 'tabs':
        return <FeedTabs activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'feed':
        return <View>{renderFeedContent}</View>;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style='dark' />
      <Animated.FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        stickyHeaderIndices={[1]} // Make the tabs (index 1) sticky
      />
      <CreatePostButton />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 600,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventsCarousel: {
    marginTop: 16,
  },
  eventsCarouselContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  eventsCarouselContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  tabs: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    zIndex: 1000,
  },
  tab: {
    backgroundColor: 'transparent',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#000',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  emptyEventsContainer: {
    backgroundColor: '#e5e5e5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
  },
  emptyEventsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyEventsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
