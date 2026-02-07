import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  SharedValue,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import Header from '@/components/Header';
import { Theme } from '@/constants/Theme';
import FeedWithHook from '@/components/FeedWithHook';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import { useForYouFeed } from '@/hooks/feeds/useForYouFeed';
import { useFollowingFeed } from '@/hooks/feeds/useFollowingFeed';
import { useGroupsFeed } from '@/hooks/feeds/useGroupsFeed';
import { memo, useState, useCallback, useRef, useEffect } from 'react';
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
import * as Haptics from 'expo-haptics';
import { useHapticsPreference } from '@/context/HapticsContext';

interface HeaderProps {
  activeIndex: number;
  onTabPress: (index: number) => void;
  scrollX: SharedValue<number>;
  screenWidth: number;
}

const TABS = ['For You', 'Following', 'Groups'] as const;
type FeedTab = (typeof TABS)[number];

const FeedTabs = memo(
  ({ activeIndex, onTabPress, scrollX, screenWidth }: HeaderProps) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const horizontalInset = 4;
    const tabWidth = containerWidth
      ? (containerWidth - horizontalInset * 2) / TABS.length
      : 0;

    const indicatorStyle = useAnimatedStyle(() => {
      if (!tabWidth || screenWidth === 0) {
        return { transform: [{ translateX: horizontalInset }] };
      }

      const translateX =
        (scrollX.value / screenWidth) * tabWidth + horizontalInset;
      return { transform: [{ translateX }] };
    }, [horizontalInset, tabWidth, screenWidth]);

    return (
      <View
        style={styles.tabs}
        onLayout={event => setContainerWidth(event.nativeEvent.layout.width)}
      >
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents='none'
            style={[styles.tabIndicator, { width: tabWidth }, indicatorStyle]}
          />
        )}
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            onPress={() => {
              onTabPress(index);
            }}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeIndex === index && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
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
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTab = TABS[activeIndex];
  const { trackScreen, trackFeedTabSwitched } = useAnalytics();
  const isFocused = useIsFocused();
  const { hapticsEnabled } = useHapticsPreference();
  const hasTrackedInitialFocus = useRef(false);
  const lastTrackedRef = useRef<number>(0);
  const activeTabRef = useRef<FeedTab>(TABS[0]);
  const scrollViewRef = useRef<React.ElementRef<typeof Animated.ScrollView>>(null);
  const { width: screenWidth } = useWindowDimensions();
  const scrollX = useSharedValue(0);

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
    (tab: FeedTab) => {
      if (!isFocused) return;

      if (hapticsEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      trackFeedTabSwitched(tab);
      // Also update the screen name for the new tab
      trackScreen(tab);
    },
    [trackFeedTabSwitched, trackScreen, isFocused, hapticsEnabled]
  );

  const handleTabPress = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      scrollViewRef.current?.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
      setActiveIndex(index);
      handleFeedTabChange(TABS[index]);
    },
    [activeIndex, screenWidth, handleFeedTabChange]
  );

  const handlePagerMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(
        event.nativeEvent.contentOffset.x / screenWidth
      );
      if (index !== activeIndex) {
        setActiveIndex(index);
        handleFeedTabChange(TABS[index]);
      }
    },
    [activeIndex, screenWidth, handleFeedTabChange]
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollX.value = event.contentOffset.x;
    },
  });

  useEffect(() => {
    const index = Math.max(0, TABS.indexOf(activeTabRef.current));
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth,
      animated: false,
    });
    scrollX.value = index * screenWidth;
  }, [screenWidth, scrollX]);

  return (
    <View style={styles.root}>
      <Header />
      <View style={styles.container}>
        <StatusBar style='dark' />
        <FeedTabs
          activeIndex={activeIndex}
          onTabPress={handleTabPress}
          scrollX={scrollX}
          screenWidth={screenWidth}
        />
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handlePagerMomentumEnd}
          style={styles.pager}
          contentContainerStyle={styles.pagerContent}
          decelerationRate='fast'
          bounces={false}
          overScrollMode='never'
          directionalLockEnabled
        >
          <View style={[styles.page, { width: screenWidth }]}>
            <FeedWithHook
              useFeedHook={useForYouFeed}
              postVariant='homeCard'
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
          <View style={[styles.page, { width: screenWidth }]}>
            <FeedWithHook
              useFeedHook={useFollowingFeed}
              postVariant='homeCard'
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
          <View style={[styles.page, { width: screenWidth }]}>
            <GroupsCarousel />
            <FeedWithHook
              useFeedHook={useGroupsFeed}
              postVariant='homeCard'
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
        </Animated.ScrollView>
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
    backgroundColor: '#EFEBE6',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 8,
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  tab: {
    backgroundColor: 'transparent',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    zIndex: 1,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.textAlternateGray,
  },
  activeTabText: {
    color: Theme.white,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    backgroundColor: Theme.primaryGatherRed,
    borderRadius: 12,
  },
  pager: {
    flex: 1,
  },
  pagerContent: {
    flexGrow: 1,
  },
  page: {
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
