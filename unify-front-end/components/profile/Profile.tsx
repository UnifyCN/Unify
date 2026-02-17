import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useState, memo, useCallback, useMemo } from 'react';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import FeedWithHook from '@/components/FeedWithHook';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import { useUserInfo } from '@/hooks/users/useUserInfo';
import BackHeader from '@/components/BackHeader';
import { FollowButton } from '@/components/profile/FollowButton';
import { useUserPosts } from '@/hooks/posts/useUserPosts';
import { useCommentedOnFeed } from '@/hooks/feeds/useCommentedOnFeed';
import { Theme } from '@/constants/Theme';
import UnifyReplyIcon from '@/components/icons/UnifyReply.svg';
import { useCurrentUser } from '@/context/UserContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserReportStatus } from '@/hooks/users/useUserReportStatus';
import { useToast } from '@/context/ToastContext';

interface TabHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
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
  const router = useRouter();
  const usePostsFeedHook = useCallback(useUserPosts.bind(null, userId), [
    userId,
  ]);
  const useCommentsFeedHook = useCallback(
    useCommentedOnFeed.bind(null, userId),
    [userId]
  );
  const { data: isReportedUser } = useUserReportStatus(userId);
  const [activeTab, setActiveTab] = useState(initialTab || 'Posts');
  const { showToast } = useToast();

  // Create data array with header, tabs, and feed content to be used to do sticky header
  const data = useMemo(
    () => [
      { key: 'header', type: 'header' },
      { key: 'tabs', type: 'tabs' },
      { key: 'feed', type: 'feed' },
    ],
    []
  );

  const reportButton = useMemo(() => {
    if (isCurrentUser) return null;

    return (
      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => {
          if (isReportedUser) {
            showToast?.("You've already reported this user.");
            return;
          }
          router.push({
            pathname: '/ReportScreen',
            params: { userId, type: 'user' },
          });
        }}
      >
        <MaterialCommunityIcons
          name={isReportedUser ? 'flag' : 'flag-outline'}
          size={26}
          color={Theme.black}
        />
      </TouchableOpacity>
    );
  }, [isCurrentUser, isReportedUser, router, showToast, userId]);

  const renderTabContent = useMemo(() => {
    if (activeTab === 'Comments') {
      return (
        <FeedWithHook
          key={`comments-${userId}`}
          useFeedHook={useCommentsFeedHook}
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
    }

    return (
      <FeedWithHook
        key={`posts-${userId}`}
        useFeedHook={usePostsFeedHook}
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
  }, [activeTab, isCurrentUser, useCommentsFeedHook, usePostsFeedHook, userId]);

  const renderItem = useCallback(
    ({ item }: { item: { key: string; type: string } }) => {
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
            <TabHeader activeTab={activeTab} setActiveTab={setActiveTab} />
          );
        case 'feed':
          return <View style={styles.feedContainer}>{renderTabContent}</View>;
        default:
          return null;
      }
    },
    [activeTab, isCurrentUser, renderTabContent, userId, userInfo]
  );

  return (
    <View style={styles.container}>
      <BackHeader
        title=''
        rightButton={
          !isCurrentUser && userInfo ? (
            <View style={styles.headerActionRow}>
              <FollowButton targetUserId={userInfo.id} compact largeCompact />
              {reportButton}
            </View>
          ) : undefined
        }
      />
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        stickyHeaderIndices={[1]}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  feedContainer: {
    flex: 1,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  reportButton: {
    minWidth: 34,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingTop: 2,
  },
  tab: {
    backgroundColor: 'transparent',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 28,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Theme.primaryGatherRed,
  },
  tabText: {
    fontSize: 17,
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
