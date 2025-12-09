import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import Header from '@/components/Header';
import { Theme } from '@/constants/Theme';
import FeedWithHook from '@/components/FeedWithHook';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import { useForYouFeed } from '@/hooks/feeds/useForYouFeed';
import { useFollowingFeed } from '@/hooks/feeds/useFollowingFeed';
import { useGroupsFeed } from '@/hooks/feeds/useGroupsFeed';
import { memo, useState, useMemo } from 'react';
import CreatePostButton from '@/components/posts/CreatePostButton';
import { HorizontalCarousel } from '@/components/HorizontalCarousel';
import { getUserJoinedGroups } from '@/services/groups/getUserJoinedGroups';
import { useQuery } from '@tanstack/react-query';
import { Group } from '@/types/groups';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { useRouter } from 'expo-router';
import GroupViewMoreCard from '@/components/icons/GroupViewMoreCard.svg';

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

const GroupsCarousel = memo(() => {
  const router = useRouter();
  const { data: groups, isLoading } = useQuery({
    queryKey: ['joined-groups'],
    queryFn: getUserJoinedGroups,
  });

  const handleGroupPress = (group: Group) => {
    router.push({
      pathname: '/(tabs)/Gather/GroupDetailScreen' as any,
      params: { group: JSON.stringify(group) },
    });
  };

  const groupsArray = groups || [];

  return (
    <View style={styles.groupsCarouselContainer}>
      <HorizontalCarousel
        title='Your Groups'
        titleStyle={styles.groupsCarouselTitle}
        data={groupsArray}
        isLoading={isLoading}
        maxItems={4} // the view more card counts as an item
        itemKeyExtractor={item => item.id}
        renderItem={(item, index) => (
          <>
            <TouchableOpacity
              style={styles.groupCardWrapper}
              onPress={() => handleGroupPress(item)}
              activeOpacity={0.8}
            >
              <ImageBackground
                source={
                  item.coverPhotoUrl
                    ? { uri: item.coverPhotoUrl }
                    : require('@/assets/images/placeholderImg.png')
                }
                style={styles.groupCard}
                imageStyle={styles.groupCardImage}
              >
                <View style={styles.groupCardOverlay} />
                <View style={styles.groupCardContent}>
                  <Text
                    style={styles.groupCardTitle}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                  >
                    {item.name}
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
            {index === groupsArray.length - 1 && (
              // TODO: Clicking on the view more cards doesnt do anything
              <View style={styles.viewMoreCardWrapper}>
                <View style={styles.viewMoreContent}>
                  <GroupViewMoreCard width={193} height={144} />
                  <View style={styles.viewMoreTextOverlay}>
                    <Text style={styles.viewMoreText}>Join more groups</Text>
                    <Text style={styles.viewMoreSubtext}>
                      There's more to check out!
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
        renderLoadingSkeleton={() => (
          <View style={styles.groupCardWrapper}>
            <View style={styles.groupCardSkeleton}>
              <SkeletonLoader
                width='70%'
                height={20}
                borderRadius={4}
                style={styles.groupCardSkeletonText}
              />
            </View>
          </View>
        )}
        renderEmptyState={() => (
          <>
            <View style={styles.emptyContainer}>
              <View style={styles.viewMoreCardWrapper}>
                <View style={styles.viewMoreContent}>
                  <GroupViewMoreCard width={193} height={144} />
                  <View style={styles.viewMoreTextOverlay}>
                    <Text style={styles.viewMoreText}>Join more groups</Text>
                    <Text style={styles.viewMoreSubtext}>
                      There's more to check out!
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
        showViewMore={false}
      />
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
          <>
            <GroupsCarousel />
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
          </>
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
  groupsCarouselContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    paddingTop: 8,
    marginBottom: -16,
  },
  groupsCarouselTitle: {
    fontSize: 24,
    fontWeight: '600',
    paddingTop: 8,
  },
  groupCardWrapper: {
    width: 185,
    height: 136,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  groupCard: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: Theme.imagePlaceholder,
  },
  groupCardImage: {
    borderRadius: 12,
  },
  groupCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
  },
  groupCardContent: {
    padding: 12,
    zIndex: 1,
  },
  groupCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.white,
    lineHeight: 20,
  },
  viewMoreCardWrapper: {
    width: 193,
    height: 144,
    marginRight: 16,
    marginLeft: -4,
    marginTop: -4,
  },
  viewMoreContent: {
    width: 193,
    height: 144,
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
    fontSize: 12,
    fontWeight: '600',
    color: Theme.black,
  },
  viewMoreSubtext: {
    fontSize: 10,
    color: Theme.black,
  },
  groupCardSkeleton: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'flex-end',
    padding: 12,
  },
  groupCardSkeletonText: {
    backgroundColor: '#D5D5D5',
  },
  emptyContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});
