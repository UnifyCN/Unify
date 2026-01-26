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
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import PagerView, {
  PagerViewOnPageScrollEventData,
  PagerViewOnPageSelectedEventData,
} from 'react-native-pager-view';
import { StatusBar } from 'expo-status-bar';
import Header from '@/components/Header';
import { Theme } from '@/constants/Theme';
import FeedWithHook from '@/components/FeedWithHook';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import { useForYouFeed } from '@/hooks/feeds/useForYouFeed';
import { useFollowingFeed } from '@/hooks/feeds/useFollowingFeed';
import { useGroupsFeed } from '@/hooks/feeds/useGroupsFeed';
import { memo, useCallback, useRef } from 'react';
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

const TABS = ['For You', 'Following', 'Groups'] as const;
const TAB_COUNT = TABS.length;
const TAB_HORIZONTAL_MARGIN = 20;

interface FeedTabsProps {
  scrollPosition: Animated.SharedValue<number>;
  onTabPress: (index: number) => void;
}

// Individual animated tab component to properly use hooks
const AnimatedTab = memo(
  ({
    tab,
    index,
    scrollPosition,
    onPress,
  }: {
    tab: string;
    index: number;
    scrollPosition: Animated.SharedValue<number>;
    onPress: () => void;
  }) => {
    const animatedTextStyle = useAnimatedStyle(() => {
      // Calculate distance from this tab (0 = fully active, 1+ = inactive)
      const distance = Math.abs(scrollPosition.value - index);
      // Clamp distance to [0, 1] for smooth interpolation
      const clampedDistance = Math.min(Math.max(distance, 0), 1);
      // Smoothly interpolate color based on distance
      const color = interpolateColor(
        clampedDistance,
        [0, 1],
        [Theme.black, Theme.textInactiveTab]
      );
      return { color };
    });

    return (
      <TouchableOpacity onPress={onPress} style={styles.tab}>
        <Animated.Text style={[styles.tabText, animatedTextStyle]}>
          {tab}
        </Animated.Text>
      </TouchableOpacity>
    );
  }
);

AnimatedTab.displayName = 'AnimatedTab';

const FeedTabs = memo(({ scrollPosition, onTabPress }: FeedTabsProps) => {
  // Use useWindowDimensions for reactive width on orientation change
  const { width: screenWidth } = useWindowDimensions();
  const tabWidth = (screenWidth - TAB_HORIZONTAL_MARGIN * 2) / TAB_COUNT;

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollPosition.value,
      [0, TAB_COUNT - 1],
      [0, tabWidth * (TAB_COUNT - 1)]
    );
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={styles.tabsContainer}>
      <View style={styles.tabs}>
        {TABS.map((tab, index) => (
          <AnimatedTab
            key={tab}
            tab={tab}
            index={index}
            scrollPosition={scrollPosition}
            onPress={() => onTabPress(index)}
          />
        ))}
      </View>
      <View style={styles.indicatorContainer}>
        <Animated.View
          style={[
            styles.indicator,
            { width: tabWidth },
            animatedIndicatorStyle,
          ]}
        />
      </View>
    </View>
  );
});

FeedTabs.displayName = 'FeedTabs';

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
      pathname: '/group-detail' as any,
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
  const { trackScreen, trackFeedTabSwitched } = useAnalytics();
  const isFocused = useIsFocused();
  const hasTrackedInitialFocus = useRef(false);
  const lastTrackedRef = useRef<number>(0);
  const activeTabRef = useRef<string>(TABS[0]);

  // Shared value for tracking pager scroll position (for animated indicator)
  const scrollPosition = useSharedValue(0);

  // Ref for programmatic pager control
  const pagerRef = useRef<PagerView>(null);

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
    }, [trackScreen])
  );

  // Handle page scroll for smooth indicator animation
  const handlePageScroll = useCallback(
    (event: { nativeEvent: PagerViewOnPageScrollEventData }) => {
      const { position, offset } = event.nativeEvent;
      scrollPosition.value = position + offset;
    },
    [scrollPosition]
  );

  // Handle page selection (when swipe completes or tab is tapped)
  const handlePageSelected = useCallback(
    (event: { nativeEvent: PagerViewOnPageSelectedEventData }) => {
      const { position } = event.nativeEvent;
      const selectedTab = TABS[position];
      activeTabRef.current = selectedTab;

      // Track the tab change
      if (isFocused) {
        trackFeedTabSwitched(selectedTab as 'For You' | 'Following' | 'Groups');
        trackScreen(selectedTab);
      }
    },
    [isFocused, trackFeedTabSwitched, trackScreen]
  );

  // Handle tab press - navigate to the selected page
  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);

  return (
    <View style={styles.root}>
      <Header />
      <View style={styles.container}>
        <StatusBar style='dark' />
        {/* Sticky tabs header */}
        <FeedTabs
          scrollPosition={scrollPosition}
          onTabPress={handleTabPress}
        />
        {/* Swipeable pager with all three feeds */}
        <PagerView
          ref={pagerRef}
          style={styles.pagerView}
          initialPage={0}
          onPageScroll={handlePageScroll}
          onPageSelected={handlePageSelected}
          offscreenPageLimit={2}
        >
          {/* For You Feed */}
          <View key="0" style={styles.pageContainer}>
            <FeedWithHook
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
          </View>

          {/* Following Feed */}
          <View key="1" style={styles.pageContainer}>
            <FeedWithHook
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
          </View>

          {/* Groups Feed */}
          <View key="2" style={styles.pageContainer}>
            <FeedWithHook
              useFeedHook={useGroupsFeed}
              ListHeaderComponent={<GroupsCarousel />}
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
          </View>
        </PagerView>
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
  tabsContainer: {
    backgroundColor: '#fff',
    zIndex: 1000,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    paddingTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: TAB_HORIZONTAL_MARGIN,
  },
  tab: {
    backgroundColor: 'transparent',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  indicatorContainer: {
    height: 2,
    marginHorizontal: TAB_HORIZONTAL_MARGIN,
    backgroundColor: 'transparent',
    marginTop: 6,
  },
  indicator: {
    height: 2,
    backgroundColor: Theme.primaryGatherRed,
    borderRadius: 1,
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
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
