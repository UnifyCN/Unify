import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import Header from '@/components/Header';
import { Theme } from '@/constants/Theme';
import { useCurrentUser } from '@/context/UserContext';
import FeedWithHook from '@/components/FeedWithHook';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import { useForYouFeed } from '@/hooks/feeds/useForYouFeed';
import { useFollowingFeed } from '@/hooks/feeds/useFollowingFeed';
import { useGroupsFeed } from '@/hooks/feeds/useGroupsFeed';
import { memo, useState, useMemo } from 'react';
import CreatePostButton from '@/components/posts/CreatePostButton';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

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

export default function HomeScreen() {
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
                message='No posts here...'
                submessage={
                  <Text style={styles.emptyMessageSubtext}>
                    You haven't followed any users yet.{'\n'}
                    Follow other users to see their posts!
                  </Text>
                }
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
                message='No groups here...'
                submessage={
                  <Text style={styles.emptyMessageSubtext}>
                    You haven't joined any groups yet.{'\n'}
                    Join a group to see their posts!
                  </Text>
                }
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
                message='No posts here...'
                submessage={
                  <Text style={styles.emptyMessageSubtext}>
                    No one has posted anything yet.{'\n'}
                    Post something to see it here!
                  </Text>
                }
              />
            }
          />
        );
    }
  }, [activeTab]);

  // Easiest way to make the header sticky
  const data = [
    { key: 'tabs', type: 'tabs' },
    { key: 'feed', type: 'feed' },
  ];

  const renderItem = ({ item }: { item: { key: string; type: string } }) => {
    switch (item.type) {
      case 'tabs':
        return <FeedTabs activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'feed':
        return <View>{renderFeedContent}</View>;
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <Header />
      <View style={styles.container}>
        <StatusBar style='dark' />
        <Animated.FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={item => item.key}
          stickyHeaderIndices={[0]} // Make the tabs (index 0) sticky
        />
        <CreatePostButton />
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
  emptyMessageSubtext: {
    fontSize: 14,
    color: Theme.textInput,
    textAlign: 'center',
    lineHeight: 20,
  },
});
