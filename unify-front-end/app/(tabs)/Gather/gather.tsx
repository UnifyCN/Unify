import { useState, memo, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import FeedWithHook from '@/components/FeedWithHook';
import { useForYouFeed } from '@/hooks/feeds/useForYouFeed';
import { useFollowingFeed } from '@/hooks/feeds/useFollowingFeed';
import { useGroupsFeed } from '@/hooks/feeds/useGroupsFeed';
import { EventsCarousel } from '@/components/EventsCarousel';
import CreatePostButton from '@/components/posts/CreatePostButton';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const GatherHeader = memo(() => {
  return (
    <View>
      <View style={styles.eventsCarousel}>
        <EventsCarousel title='Gather Events' titleStyle={styles.headerText} />
      </View>

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
          <FeedWithHook
            key={`following-${activeTab}`}
            useFeedHook={useFollowingFeed}
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
          <FeedWithHook
            key={`groups-${activeTab}`}
            useFeedHook={useGroupsFeed}
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
          <FeedWithHook
            key={`foryou-${activeTab}`}
            useFeedHook={useForYouFeed}
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
  headerText: {
    fontSize: 16,
    fontWeight: 600,
  },
  eventsCarousel: {
    marginTop: 16,
    paddingHorizontal: 20,
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
});
