import { memo, useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { EventsCarousel } from '@/components/EventsCarousel';
import TabHeader from '@/components/home/HomeHeader';
import { getAvailableGroups } from '@/services/groups/getAvailableGroups';
import { useQuery } from '@tanstack/react-query';
import { Group } from '@/types/groups';
import { NewsCarousel } from '@/components/news/NewsCarousel';
import { CommunityMatchingEntryCard } from '@/ui/communityMatching/EntryCard';
import { useFocusEffect } from '@react-navigation/native';
import { useAnalytics } from '@/utils/analytics';
import RequestGroupModal from '@/components/groups/RequestGroupModal';
import { getProfilePictureUrl } from '@/services/s3/uploadProfilePicture';
import { Theme } from '@/constants/Theme';
import { getPersonalizedGroups } from '@/services/groups/getPersonalizedGroups';
import { getUserJoinedGroups } from '@/services/groups/getUserJoinedGroups';

const GROUP_CARD_GAP = 12;
const SECTION_HORIZONTAL_PADDING = 20;
const GROUP_IMAGE_SIZE = 57;
const GROUP_CARD_HEIGHT = 82;
const STACK_CARD_GAP = 10;

const GroupCoverImage = memo(({ group }: { group: Group }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const hasCover = !!group.coverPhotoUrl;
  const shouldSignUrl = hasCover && !group.coverPhotoUrl?.startsWith('http');

  const { data: signedCoverUrl } = useQuery({
    queryKey: ['group-cover-signed-url', group.coverPhotoUrl],
    enabled: !!shouldSignUrl && !imageFailed,
    queryFn: () => getProfilePictureUrl(group.coverPhotoUrl as string),
    staleTime: 4 * 60 * 1000,
  });

  const imageUri = shouldSignUrl ? signedCoverUrl : group.coverPhotoUrl;
  const showFallback = !hasCover || !imageUri || imageFailed;

  if (showFallback) {
    return (
      <View style={styles.thumbFallback} accessibilityRole='image'>
        <Feather name='users' size={18} color='#8A8A8A' />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={styles.thumbImage}
      resizeMode='cover'
      onError={() => setImageFailed(true)}
    />
  );
});
GroupCoverImage.displayName = 'GroupCoverImage';

const GroupDiscoveryCard = memo(
  ({
    group,
    onPress,
    cardWidth,
  }: {
    group: Group;
    onPress: () => void;
    cardWidth: number;
  }) => {
    const description = group.description?.trim() || 'Recommended community';

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.discoveryCard, { width: cardWidth }]}
        accessibilityRole='button'
        accessibilityLabel={`Open group ${group.name}`}
      >
        <View style={styles.discoveryImageWrap}>
          <GroupCoverImage group={group} />
        </View>
        <View style={styles.discoveryTextWrap}>
          <View style={styles.discoveryTopRow}>
            <Text style={styles.discoveryCardTitle} numberOfLines={1}>
              {group.name}
            </Text>
            {group.why_tag? (
              <>
                <Text style={styles.whySeparator}>|</Text>
                <Text style={styles.discoveryCardWhy} numberOfLines={1}>
                  {group.why_tag}
                </Text>
              </>
            ) : null}
          </View>

          <Text style={styles.discoveryCardDescription} numberOfLines={2}>
            {description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
);
GroupDiscoveryCard.displayName = 'GroupDiscoveryCard';

const GroupDiscoverySkeleton = () => {
  return (
    <View style={styles.discoveryCard}>
      <View style={styles.skeletonThumb} />
      <View style={styles.discoveryTextWrap}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonWhy} />
        <View style={styles.skeletonSubtitle} />
      </View>
    </View>
  );
};

const GroupsForYouSection = () => {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [requestOpen, setRequestOpen] = useState(false);
  const contentWidth = screenWidth - SECTION_HORIZONTAL_PADDING * 2;
  const columnWidth = Math.min(contentWidth, 420);

  const { data: groups, isLoading } = useQuery<Group[], Error>({
    queryKey: ['personalize', 'groups'],
    queryFn: async () => {
      try {
        const personalized = await getPersonalizedGroups();
        // Extra safety: exclude already-joined groups client-side
        let joined: Group[] = [];
        try {
          joined = await getUserJoinedGroups();
        } catch (e) {
          console.warn('Failed to fetch joined groups for filtering', e);
        }
        const joinedIds = new Set(joined.map(g => g.id));

        const filtered = (personalized || []).filter(g => !joinedIds.has(g.id));

        // Ensure score-descending order
        filtered.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

        return filtered;
      } catch (err) {
        console.warn(
          'Personalize failed — falling back to available groups',
          err
        );
        return getAvailableGroups();
      }
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });

  const featuredGroups = (groups ?? []).slice(0, 10);
  const groupedColumns = featuredGroups.reduce<Group[][]>(
    (acc, group, index) => {
      const columnIndex = Math.floor(index / 2);
      if (!acc[columnIndex]) acc[columnIndex] = [];
      acc[columnIndex].push(group);
      return acc;
    },
    []
  );

  const handleGroupPress = (group: Group) => {
    router.push({
      pathname: '/group-detail' as any,
      params: { group: JSON.stringify(group) },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.headerText}>Join Groups</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupsCarouselContent}
          style={styles.groupsCarousel}
          decelerationRate='fast'
          snapToInterval={columnWidth + GROUP_CARD_GAP}
          snapToAlignment='start'
          disableIntervalMomentum
        >
          {[1, 2].map(i => (
            <View key={i} style={[styles.groupsColumn, { width: columnWidth }]}>
              <GroupDiscoverySkeleton />
              <GroupDiscoverySkeleton />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.headerText}>Join Groups</Text>
        </View>
        <View style={styles.emptyStateContainer}>
          <Pressable
            onPress={() => setRequestOpen(true)}
            style={({ pressed }) => [
              styles.requestButton,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Text style={styles.requestButtonText}>Request a Group</Text>
          </Pressable>
        </View>
        <RequestGroupModal
          visible={requestOpen}
          onClose={() => setRequestOpen(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.headerText}>Join Groups</Text>
        <Pressable
          onPress={() => router.push('/see-more-groups')}
          style={({ pressed }) => [
            styles.seeAllButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <Feather name='chevron-right' size={16} color='#6A6A6A' />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.groupsCarouselContent}
        style={styles.groupsCarousel}
        decelerationRate='fast'
        snapToInterval={columnWidth + GROUP_CARD_GAP}
        snapToAlignment='start'
        disableIntervalMomentum
      >
        {groupedColumns.map((columnGroups, index) => (
          <View
            key={`groups-column-${index}`}
            style={[styles.groupsColumn, { width: columnWidth }]}
          >
            {columnGroups.map(group => (
              <GroupDiscoveryCard
                key={group.id}
                group={group}
                onPress={() => handleGroupPress(group)}
                cardWidth={columnWidth}
              />
            ))}
            {columnGroups.length === 1 && <View style={styles.cardSpacer} />}
          </View>
        ))}
      </ScrollView>
      <View style={styles.requestButtonContainer}>
        <Pressable
          onPress={() => setRequestOpen(true)}
          style={({ pressed }) => [
            styles.requestButton,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Text style={styles.requestButtonText}>Request a Group</Text>
        </Pressable>
      </View>
      <RequestGroupModal
        visible={requestOpen}
        onClose={() => setRequestOpen(false)}
      />
    </View>
  );
};

const GatherHeader = memo(() => {
  return (
    <View style={styles.eventsCarousel}>
      <EventsCarousel title='Community Events' titleStyle={styles.headerText} />
    </View>
  );
});
GatherHeader.displayName = 'GatherHeader';

export default function GatherScreen() {
  const router = useRouter();
  const { trackScreen } = useAnalytics();
  const lastTrackedRef = useRef<number>(0);

  // Track screen view on focus - with debounce to prevent duplicates
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // Only track if more than 500ms since last track (prevents rapid focus/blur duplicates)
      if (now - lastTrackedRef.current > 500) {
        trackScreen('Community');
        lastTrackedRef.current = now;
      }
    }, [trackScreen])
  );

  return (
    <View style={styles.root}>
      <TabHeader variant='minimal' title='Community' />
      <View style={styles.container}>
        <StatusBar style='dark' />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.entryWrapper}>
            <CommunityMatchingEntryCard
              onPress={() => router.push('/community-matching')}
            />
          </View>
          <GatherHeader />
          <NewsCarousel />
          <GroupsForYouSection />
        </ScrollView>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  entryWrapper: {
    marginTop: 16,
  },
  searchButton: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 100,
    height: 36,
  },
  searchPlaceholder: {
    fontSize: 14,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
  },
  eventsCarousel: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 14,
    color: '#6A6A6A',
    fontWeight: '500',
  },
  groupsCarousel: {
    marginBottom: 2,
  },
  groupsCarouselContent: {
    paddingHorizontal: SECTION_HORIZONTAL_PADDING,
    gap: GROUP_CARD_GAP,
  },
  groupsColumn: {
    gap: STACK_CARD_GAP,
  },
  discoveryCard: {
    backgroundColor: Theme.white,
    borderColor: Theme.borderCard,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: GROUP_CARD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  discoveryImageWrap: {
    width: GROUP_IMAGE_SIZE,
    height: GROUP_IMAGE_SIZE,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFEFEF',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoveryTextWrap: {
    flex: 1,
    minHeight: GROUP_IMAGE_SIZE,
    justifyContent: 'center',
  },
  discoveryCardTitle: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '600',
    color: Theme.black,
    marginBottom: 2,
  },
  discoveryCardWhy: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: Theme.primaryGatherRed,
  },
  discoveryCardDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: Theme.black,
  },
  emptyStateContainer: {
    paddingHorizontal: 20,
  },
  requestButtonContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  requestButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.borderCard,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.white,
  },
  requestButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  skeletonThumb: {
    width: GROUP_IMAGE_SIZE,
    height: GROUP_IMAGE_SIZE,
    borderRadius: 999,
    backgroundColor: '#E9E9E9',
  },
  skeletonTitle: {
    width: '80%',
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E9E9E9',
  },
  skeletonSubtitle: {
    marginTop: 8,
    width: '92%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E9E9E9',
  },
  skeletonWhy: {
    marginTop: 8,
    width: '92%',
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.primaryGatherRed,
  },
  cardSpacer: {
    height: GROUP_CARD_HEIGHT,
  },
  pressed: {
    opacity: 0.8,
  },
  discoveryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whySeparator: {
    fontSize: 12,
    color: '#6A6A6A',
  },
});
