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
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useScrollContext } from '@/context/ScrollContext';
import { useScrollVisibility } from '@/hooks/useScrollVisibility';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// import Search from '@/assets/images/search.svg';
// import CreatePost from '@/assets/images/create_post_button.svg';
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

const GatherHeader = memo(({ activeTab, setActiveTab }: HeaderProps) => {
  const router = useRouter();

  const { data: events, isLoading } = useEvents();

  const displayEvents = events?.slice(0, 3) || [];

  return (
    <View>
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
        contentContainerStyle={styles.eventsCarouselContent}
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color='#000' />
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
      <View style={styles.tabs}>
        {['For You', 'Following', 'Groups'].map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
        return <GroupsFeed key={`groups-${activeTab}`} />;
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

  const [scrollValue] = useScrollContext();
  const previousScrollValue = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    // Change this if this cause any error
    onScroll: e => {
      const offsetY = e.contentOffset.y;
      if (offsetY < 0 || offsetY > e.contentSize.height) return;

      scrollValue.value = Math.max(
        0,
        Math.min(
          1,
          scrollValue.value +
            (offsetY - previousScrollValue.value) / SCROLL_DISTANCE
        )
      );

      previousScrollValue.value = offsetY;
    },
  });

  const visibilityProgress = useScrollVisibility();
  // Hide the post button, 135 is the combination of the button diameter + 75 offset from the bottom
  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: visibilityProgress.value * 135 }],
    }),
    [visibilityProgress]
  );

  return (
    <View style={styles.container}>
      <StatusBar style='dark' />
      <Animated.FlatList
        data={[{ key: 'feed' }]}
        renderItem={() => (
          <View style={styles.feedContainer}>{renderFeedContent}</View>
        )}
        keyExtractor={item => item.key}
        ListHeaderComponent={
          <GatherHeader activeTab={activeTab} setActiveTab={setActiveTab} />
        }
        onScroll={scrollHandler}
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  feedContainer: {
    paddingBottom: 44,
    marginBottom: 36,
  },
  tabs: {
    marginTop: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
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
});
