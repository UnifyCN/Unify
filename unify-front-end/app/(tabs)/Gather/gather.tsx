import { useState, memo, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FeedWithHook from '@/components/FeedWithHook';
import { useForYouFeed } from '@/hooks/feeds/useForYouFeed';
import { useFollowingFeed } from '@/hooks/feeds/useFollowingFeed';
import { useGroupsFeed } from '@/hooks/feeds/useGroupsFeed';
import { EventsCarousel } from '@/components/EventsCarousel';
import CreatePostButton from '@/components/posts/CreatePostButton';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import { Theme } from '@/constants/Theme';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const GatherHeader = memo(() => {
  const router = useRouter();

  const handleSearchPress = () => {
    router.push('/(tabs)/Gather/SearchScreen');
  };

  return (
    <View>
      <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
        <Feather name='search' size={20} color={Theme.textInput} />
        <Text style={styles.searchPlaceholder}>
          Search for posts and groups
        </Text>
      </TouchableOpacity>

      <View style={styles.eventsCarousel}>
        <EventsCarousel
          title='Community Events'
          titleStyle={styles.headerText}
        />
      </View>
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
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surfaceTextInput,
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 100,
    height: 36,
    gap: 8,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: Theme.textInput,
    flex: 1,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 600,
  },
  eventsCarousel: {
    marginTop: 27,
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
    zIndex: 1000,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    backgroundColor: 'transparent',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Theme.primaryGatherRed,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.textInactiveTab,
  },
  activeTabText: {
    color: Theme.black,
    fontWeight: '600',
  },
});
