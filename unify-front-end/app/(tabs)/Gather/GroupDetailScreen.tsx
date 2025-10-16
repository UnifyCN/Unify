import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Group } from '@/types/groups';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useHeaderVisibility } from '@/components/HeaderVisibilityProvider';
import { getGroupByName } from '@/services/groups/getGroupByName';
import { PostItem } from '@/components/home/PostItem';
import CreatePostButton from '@/components/posts/CreatePostButton';
import { useGroupPosts } from '@/hooks/feeds/useGroupPosts';
import { joinGroup } from '@/services/groups/joinGroup';
import { leaveGroup } from '@/services/groups/leaveGroup';
import { checkUserGroupMembership } from '@/services/groups/checkUserGroupMembership';
import { usePostMetadata } from '@/hooks/usePostMetadata';
import { PostData } from '@/types/feeds/post';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { SkeletonLoaderPostItem } from '@/components/SkeletonLoaderPostItem';

const GroupDetailScreen = () => {
  const router = useRouter();
  const { group, groupName } = useLocalSearchParams();
  const [groupData, setGroupData] = useState<Group | null>(
    group ? (JSON.parse(group as string) as Group) : null
  );
  const [loading, setLoading] = useState(false);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [joining, setJoining] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const { setVisible } = useHeaderVisibility();

  const queryClient = useQueryClient();

  useEffect(() => {
    // Always hide the main header when this screen is active
    setVisible(false);
    return () => setVisible(true);
  }, []);

  useEffect(() => {
    // Reset header opacity when component mounts
    headerOpacity.setValue(0);
    setIsAtTop(true);
  }, [headerOpacity]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // If we don't have groupData but have a groupName, try to fetch and set it
        if (!groupData) {
          const name = groupName as string | undefined;
          if (!name) return;

          setLoading(true);
          const found = await getGroupByName(name);
          if (!mounted) return;
          if (found) {
            setGroupData(found);
            // Check membership for the found group
            const member = await checkUserGroupMembership(found.id);
            if (!mounted) return;
            setIsMember(member);
          }
          return;
        }

        // We have groupData: check membership (only if isMember is still null)
        if (isMember === null) {
          setLoading(true);
          const member = await checkUserGroupMembership(groupData.id);
          if (!mounted) return;
          setIsMember(member);
        }
      } catch (err) {
        console.error('Group detail init error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [groupName]);

  // posts for this group
  const groupId = groupData?.id;
  const {
    data: postsData,
    fetchNextPage,
    isLoading: postsLoading,
    refetch,
  } = useGroupPosts(groupId);
  const posts =
    (postsData as any)?.pages.flatMap((page: any) => page.posts) ?? [];

  // Get post IDs for metadata fetching
  const postIds = posts.map((post: PostData) => post.id);
  const { data: postMetadata } = usePostMetadata(postIds);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleJoinToggle = async () => {
    if (!groupData) return;
    if (joining) return;
    setJoining(true);

    // Store original values for rollback
    const originalIsMember = isMember;
    const originalMemberCount = groupData.memberCount;

    try {
      if (isMember) {
        // Optimistically update UI for leaving
        await leaveGroup(groupData.id);
        setIsMember(false);
        setGroupData(prev =>
          prev
            ? {
                ...prev,
                memberCount: Math.max(0, prev.memberCount - 1),
              }
            : prev
        );
      } else {
        // Optimistically update UI for joining

        await joinGroup(groupData.id);
        queryClient.invalidateQueries({ queryKey: ['joined-groups'] });
        setIsMember(true);
        setGroupData(prev =>
          prev
            ? {
                ...prev,
                memberCount: prev.memberCount + 1,
              }
            : prev
        );
      }
    } catch (err) {
      console.error('Join toggle failed', err);
      // Rollback optimistic updates on error
      setIsMember(originalIsMember);
      setGroupData(prev =>
        prev
          ? {
              ...prev,
              memberCount: originalMemberCount,
            }
          : prev
      );
    } finally {
      queryClient.refetchQueries({ queryKey: ['feed', 'groups'] });
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Cover Image Skeleton */}
        <SkeletonLoader
          width='100%'
          height={330}
          style={styles.imageContainer}
        />

        {/* Group Info Skeleton */}
        <View style={styles.card}>
          <SkeletonLoader width='60%' height={28} style={{ marginBottom: 8 }} />
          <SkeletonLoader
            width='30%'
            height={16}
            style={{ marginBottom: 12 }}
          />
          <SkeletonLoader
            width='100%'
            height={16}
            style={{ marginBottom: 4 }}
          />
          <SkeletonLoader width='80%' height={16} style={{ marginBottom: 4 }} />
          <SkeletonLoader width='60%' height={16} />
        </View>

        {/* Posts Skeleton */}
        <View style={{ backgroundColor: '#fff' }}>
          {[1, 2, 3].map(i => (
            <SkeletonLoaderPostItem key={i} />
          ))}
        </View>
      </View>
    );
  }

  if (!groupData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Group not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} key={groupData.id}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: headerOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: ['transparent', '#fff'],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <View style={styles.backButton}>
                <Feather
                  name='chevron-left'
                  size={24}
                  color={isAtTop ? '#fff' : '#000'}
                />
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Single scrollable content */}
      <Animated.FlatList
        data={posts}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <PostItem post={item} metadata={postMetadata?.[item.id]} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={() => (
          <>
            {/* header image area */}
            <View style={styles.imageContainer}>
              {groupData.coverPhotoUrl ? (
                <Image
                  source={{ uri: groupData.coverPhotoUrl }}
                  style={styles.eventImage}
                />
              ) : (
                <View style={styles.imagePlaceholder} />
              )}

              {/* Join button on image */}
              <TouchableOpacity
                style={styles.joinButton}
                onPress={handleJoinToggle}
                disabled={joining}
              >
                <Text style={styles.joinText}>
                  {isMember ? 'Joined' : 'Join'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* white card with title/desc */}
            <View style={styles.card}>
              <Text style={styles.eventTitle}>{groupData.name}</Text>
              <Text style={styles.subtitle}>
                {groupData.memberCount} members
              </Text>
              <Text style={styles.aboutText}>{groupData.description}</Text>
            </View>
          </>
        )}
        ListEmptyComponent={() => {
          if (postsLoading) return null;
          return (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateContent}>
                <Feather name='message-circle' size={48} color='#D1D1D6' />
                <Text style={styles.emptyStateTitle}>No posts yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Be the first to start the conversation
                </Text>
              </View>
            </View>
          );
        }}
        onEndReached={() => fetchNextPage()}
        onEndReachedThreshold={0.5}
        onScroll={event => {
          const offsetY = event.nativeEvent.contentOffset.y;
          const atTop = offsetY <= 50;
          setIsAtTop(atTop);

          // Smooth transition with easing
          Animated.timing(headerOpacity, {
            toValue: atTop ? 0 : 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start();
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      />

      {/* floating create post button, prefilled with group */}
      <CreatePostButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    gap: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    position: 'absolute',
    paddingTop: 24,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 330,
    backgroundColor: '#C4C4C4',
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#C4C4C4',
  },
  eventContent: {
    backgroundColor: '#fff',
    padding: 20,
    height: '100%',
  },
  eventTitle: {
    fontSize: 25,
    fontWeight: '600',
    color: '#343434',
  },
  aboutText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  joinButton: {
    backgroundColor: '#2F2F2F',
    paddingHorizontal: 20,
    paddingVertical: 6.5,
    borderRadius: 15,
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  joinText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 25,
  },
  card: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default GroupDetailScreen;
