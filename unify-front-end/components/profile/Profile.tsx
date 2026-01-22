import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useState, useMemo, memo, useEffect } from 'react';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import FeedWithHook from '@/components/FeedWithHook';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import { useUserInfo } from '@/hooks/users/useUserInfo';
import BackHeader from '@/components/BackHeader';
import { useUserPosts } from '@/hooks/posts/useUserPosts';
import { useCommentedOnFeed } from '@/hooks/feeds/useCommentedOnFeed';
import { Theme } from '@/constants/Theme';
import UnifyReplyIcon from '@/components/icons/UnifyReply.svg';
import { useCurrentUser } from '@/context/UserContext';

interface TabHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCurrentUser: boolean;
}

const TabHeader = memo(({ activeTab, setActiveTab }: TabHeaderProps) => {
  const tabs = ['Posts', 'Comments'];

  return (
    <View style={styles.tabs}>
      {tabs.map(tab => (
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

interface ProfileProps {
  userId: string;
  initialTab?: string;
}

export default function Profile({ userId, initialTab }: ProfileProps) {
  const { currentUser } = useCurrentUser();
  const { data: userInfo } = useUserInfo(userId);
  const isCurrentUser = currentUser?.id === userId;

  const [activeTab, setActiveTab] = useState(initialTab || 'Posts');

  // Create data array with header, tabs, and feed content to be used to do sticky header
  const data = [
    { key: 'header', type: 'header' },
    { key: 'tabs', type: 'tabs' },
    { key: 'feed', type: 'feed' },
  ];

  const renderItem = ({ item }: { item: { key: string; type: string } }) => {
    switch (item.type) {
      case 'header':
        return (
          <ProfileHeader
            key={userId}
            isCurrentUser={isCurrentUser}
            userInfo={userInfo}
          />
        );
      case 'tabs':
        return (
          <TabHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isCurrentUser={isCurrentUser}
          />
        );
      case 'feed':
        return <View style={styles.feedContainer}>{renderTabContent}</View>;
      default:
        return null;
    }
  };

  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case 'Comments':
        return (
          <FeedWithHook
            key={`comments-${userId}`}
            useFeedHook={() => useCommentedOnFeed(userId)}
            ListEmptyComponent={
              <EmptyFeedMessage
                icon={<UnifyReplyIcon width={27} height={25} />}
                message='Looks a little quiet here...'
                submessage={
                  isCurrentUser ? (
                    <Text style={styles.emptyMessageSubtext}>
                      You haven't commented on any posts yet
                    </Text>
                  ) : (
                    <Text style={styles.emptyMessageSubtext}>
                      This person hasn't commented on any posts yet
                    </Text>
                  )
                }
              />
            }
          />
        );
      default:
        return (
          <FeedWithHook
            key={`posts-${userId}`}
            useFeedHook={() => useUserPosts(userId)}
            ListEmptyComponent={
              <EmptyFeedMessage
                icon={<UnifyReplyIcon width={27} height={25} />}
                message='Looks a little quiet here...'
                submessage={
                  isCurrentUser ? (
                    <Text style={styles.emptyMessageSubtext}>
                      We'd love to hear from you!{'\n'}
                      Create a post to show up here.
                    </Text>
                  ) : (
                    <Text style={styles.emptyMessageSubtext}>
                      This person hasn't posted anything yet.
                    </Text>
                  )
                }
              />
            }
          />
        );
    }
  }, [activeTab, userId, isCurrentUser]);

  return (
    <View style={styles.container}>
      <BackHeader title='' />
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        stickyHeaderIndices={[1]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    backgroundColor: '#fff',
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  feedLoadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  feedContainer: {
    flex: 1,
  },
  tabs: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    paddingTop: 8,
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
    fontSize: 16,
    fontWeight: '600',
    color: Theme.textInactiveTab,
  },
  activeTabText: {
    color: Theme.black,
  },
  emptyMessageSubtext: {
    fontSize: 14,
    color: Theme.textInput,
    textAlign: 'center',
    lineHeight: 20,
  },
});
