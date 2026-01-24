import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import Header from '@/components/Header';
import { Theme } from '@/constants/Theme';
import FeedWithHook from '@/components/FeedWithHook';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import { useForYouFeed } from '@/hooks/feeds/useForYouFeed';
import { useFollowingFeed } from '@/hooks/feeds/useFollowingFeed';
import { useGroupsFeed } from '@/hooks/feeds/useGroupsFeed';
import { memo, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import CreatePostButton from '@/components/posts/CreatePostButton';
import { HorizontalCarousel } from '@/components/HorizontalCarousel';
import { getUserJoinedGroups } from '@/services/groups/getUserJoinedGroups';
import { useQuery } from '@tanstack/react-query';
import { Group } from '@/types/groups';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { useRouter } from 'expo-router';
import GroupViewMoreCard from '@/components/icons/GroupViewMoreCard.svg';
import ViewMoreCardNews from '@/components/icons/ViewMoreCardNews.svg';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAnalytics } from '@/utils/analytics';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTabChange?: (tab: string) => void;
}

const TABS = ['For You', 'Following', 'Groups'];
const TAB_MARGIN_HORIZONTAL = 20;

const FeedTabs = memo(
  ({ activeTab, setActiveTab, onTabChange }: HeaderProps) => {
    const { width } = useWindowDimensions();
    const activeIndex = Math.max(0, TABS.indexOf(activeTab));
    const indicatorPosition = useSharedValue(activeIndex);
    const tabWidth = width / TABS.length;
    const indicatorWidth = tabWidth - TAB_MARGIN_HORIZONTAL * 2;

    useEffect(() => {
      indicatorPosition.value = withSpring(activeIndex, {
        damping: 20,
        stiffness: 200,
      });
    }, [activeIndex]);

    const indicatorStyle = useAnimatedStyle(
      () => ({
        transform: [{ translateX: indicatorPosition.value * tabWidth }],
      }),
      [tabWidth]
    );

    return (
      <View style={styles.tabs}>
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            onPress={() => {
              if (tab !== activeTab && onTabChange) {
                onTabChange(tab);
              }
              setActiveTab(tab);
            }}
            style={styles.tab}
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
        <Animated.View
          style={[
            styles.tabIndicator,
            indicatorStyle,
            { left: TAB_MARGIN_HORIZONTAL, width: indicatorWidth },
          ]}
        />
      </View>
    );
  }
);

const GroupsCarousel = memo(() => {
  const router = useRouter();
  const { width: screenWidth } = Dimensions.get('window');
  const fullCardWidth = screenWidth - 40; // 20px padding on each side
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

  const handleViewMoreGroupsPress = () => {
    router.push('/(tabs)/Gather' as any);
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
              <TouchableOpacity
                style={styles.viewMoreCardWrapper}
                onPress={handleViewMoreGroupsPress}
                activeOpacity={0.8}
              >
                <View style={styles.viewMoreContent}>
                  <GroupViewMoreCard width={193} height={144} />
                  <View style={styles.viewMoreTextOverlay}>
                    <Text style={styles.viewMoreText}>Join groups!</Text>
                    <Text style={styles.viewMoreSubtext}>
                      There's more to check out!
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.viewMoreCardWrapperFullWidth}
                onPress={handleViewMoreGroupsPress}
                activeOpacity={0.8}
              >
                <View style={styles.viewMoreContentFullWidth}>
                  <ViewMoreCardNews width={fullCardWidth} height={144} />
                  <View style={styles.viewMoreTextOverlay}>
                    <Text style={styles.viewMoreText}>Join groups!</Text>
                    <Text style={styles.viewMoreSubtext}>
                      There's more to check out!
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
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
  const { trackScreen, trackFeedTabSwitched } = useAnalytics();
  const isFocused = useIsFocused();
  const hasTrackedInitialFocus = useRef(false);
  const lastTrackedRef = useRef<number>(0);
  const activeTabRef = useRef(activeTab);

  // Keep ref in sync with state
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Track screen view on focus - only once per focus, with debounce
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastTrackedRef.current > 500) {
        trackScreen(activeTabRef.current);
        lastTrackedRef.current = now;
      }
      hasTrackedInitialFocus.current = true;

      return () => {
        hasTrackedInitialFocus.current = false;
      };
    }, [trackScreen]) // Intentionally exclude activeTab to prevent re-firing on internal tab changes
  );

  // Track feed tab switches - this handles internal Home tab changes
  const handleFeedTabChange = useCallback(
    (tab: string) => {
      if (!isFocused) return;

      const tabName = tab as 'For You' | 'Following' | 'Groups';
      trackFeedTabSwitched(tabName);
      // Also update the screen name for the new tab
      trackScreen(tabName);
    },
    [trackFeedTabSwitched, trackScreen, isFocused]
  );

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
                  message='No group posts here...'
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
        return (
          <FeedTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onTabChange={handleFeedTabChange}
          />
        );
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
    paddingTop: 8,
  },
  tab: {
    backgroundColor: 'transparent',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: TAB_MARGIN_HORIZONTAL,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: Theme.primaryGatherRed,
    borderRadius: 1,
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
    fontSize: 18,
    fontWeight: '600',
    color: Theme.black,
  },
  viewMoreSubtext: {
    fontSize: 14,
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
  viewMoreCardWrapperFullWidth: {
    width: '100%',
    height: 144,
    marginRight: 0,
    marginLeft: 0,
    marginTop: 0,
  },
  viewMoreContentFullWidth: {
    width: '100%',
    height: 144,
    position: 'relative',
  },
});
