import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Share, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { Group } from '@/types/groups';
import { useEffect, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useHeaderVisibility } from '@/components/HeaderVisibilityProvider';
import { getAllGroups } from '@/services/groups/getAllGroups';
import { PostItem } from '@/components/home/PostItem';
import CreatePostButton from '@/components/posts/CreatePostButton';
import { useGroupPosts } from '@/hooks/feeds/useGroupPosts';
import { joinGroup } from '@/services/groups/joinGroup';
import { leaveGroup } from '@/services/groups/leaveGroup';
import { checkUserGroupMembership } from '@/services/groups/checkUserGroupMembership';

const GroupDetailScreen = () => {
  const router = useRouter();
  const { group, groupName } = useLocalSearchParams();
  const [groupData, setGroupData] = useState<Group | null>(
    group ? (JSON.parse(group as string) as Group) : null
  );
  const [loading, setLoading] = useState(false);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [joining, setJoining] = useState(false);

  const { setVisible } = useHeaderVisibility();

  const queryClient = useQueryClient();

  useEffect(() => {
    setVisible(false);
    return () => setVisible(true);
  }, [setVisible]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // If we don't have groupData but have a groupName, try to fetch and set it
        if (!groupData) {
          const name = groupName as string | undefined;
          if (!name) return;

          setLoading(true);
          const groups = await getAllGroups();
          if (!mounted) return;
          const found = groups.find(g => g.name === name);
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
  const group_id = groupData?.id;
  const postsQuery = useGroupPosts(group_id);
  const posts = useMemo(() => {
    const d: any = postsQuery.data;
    if (!d) return [];
    if (d.pages) return d.pages.flatMap((p: any) => p.posts ?? []);
    return d.posts ?? [];
  }, [postsQuery.data]);

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
      // invalidate group detail and groups feed so lists refresh
      queryClient.invalidateQueries({ queryKey: ['group', groupData.id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      // also invalidate feed caches so the feed reflects membership changes
      queryClient.invalidateQueries({ queryKey: ['feed', 'groups'] });
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading group...</Text>
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
    <SafeAreaView style={styles.container}>
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

        <View style={styles.header} pointerEvents='box-none'>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name='chevron-left' size={24} color='#fff' />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          {/* TODO: SHARE BUTTON */}
          {/* <TouchableOpacity
            accessibilityLabel='Share group'
            accessibilityRole='button'
            onPress={async () => {
              try {
                const title = groupData.name;
                const text = 'Join this group in the Unify App!';
                // Use expo-linking to build a deep link using the app's configured scheme
                const deepLink = Linking.createURL(`group/${groupData.id}`);

                // On Android the 'message' should include the link; on iOS the 'url' field may be used
                await Share.share({
                  title,
                  message: `${text}\n\n${deepLink}`,
                  url: deepLink,
                });
              } catch (err) {
                console.error('Share failed', err);
                Alert.alert('Error', 'Could not open share dialog');
              }
            }}
            style={styles.shareButton}
          >
            <Feather name='share' size={20} color='#fff' />
          </TouchableOpacity> */}
        </View>

        {/* Join button on image */}
        <TouchableOpacity
          style={styles.joinButton}
          onPress={handleJoinToggle}
          disabled={joining}
        >
          <Text style={styles.joinText}>{isMember ? 'Joined' : 'Join'}</Text>
        </TouchableOpacity>
      </View>

      {/* white card with title/desc */}
      <View style={styles.card}>
        <Text style={styles.eventTitle}>{groupData.name}</Text>
        <Text style={styles.subtitle}>{groupData.memberCount} members</Text>
        <Text style={styles.aboutText}>{groupData.description}</Text>
      </View>

      {/* posts list */}
      <FlatList
        data={posts}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <PostItem post={item} />}
        ListEmptyComponent={() => (
          <View style={{ padding: 20 }}>
            <Text style={{ color: '#666' }}>No posts yet</Text>
          </View>
        )}
        onEndReached={() => postsQuery.fetchNextPage()}
        onEndReachedThreshold={0.5}
      />

      {/* floating create post button, prefilled with group */}
      <CreatePostButton />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C4C4C4',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: 'transparent',
    zIndex: 10,
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
});

export default GroupDetailScreen;
