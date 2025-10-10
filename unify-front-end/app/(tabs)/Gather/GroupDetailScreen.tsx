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
import { useHeaderVisibility } from '@/components/HeaderVisibilityProvider';
import { getAllGroups } from '@/services/groups/getAllGroups';
import { PostItem } from '@/components/home/PostItem';
import CreatePostButton from '@/components/posts/CreatePostButton';
import { useGroupPosts } from '@/hooks/feeds/useGroupPosts';
import { getUserJoinedGroups } from '@/services/groups/getUserJoinedGroups';
import { joinGroup } from '@/services/groups/joinGroup';
import { leaveGroup } from '@/services/groups/leaveGroup';
import { supabase } from '@/lib/supabase';

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

  useEffect(() => {
    setVisible(false);
    return () => setVisible(true);
  }, [setVisible]);

  // load membership status
  useEffect(() => {
    let mounted = true;
    if (!groupData) return;
    (async () => {
      try {
        const joined = await getUserJoinedGroups();
        if (!mounted) return;
        setIsMember(Boolean(joined.find(g => g.id === groupData.id)));
      } catch (err) {
        console.error('failed to check membership', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [groupData]);

  useEffect(() => {
    // If we already have group data from params, nothing to do
    if (groupData) return;

    // If groupName provided, try to fetch groups and find by name
    const name = groupName as string | undefined;
    if (!name) return;

    let mounted = true;
    setLoading(true);
    getAllGroups()
      .then(groups => {
        if (!mounted) return;
        const found = groups.find(g => g.name === name);
        if (found) setGroupData(found);
      })
      .catch(err => console.error('Failed to load groups for detail screen', err))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [groupData, groupName]);

  // posts for this group
  const groupId = groupData?.id;
  const postsQuery = useGroupPosts(groupId);
  const posts = useMemo(() => {
    const d: any = postsQuery.data;
    if (!d) return [];
    if (d.pages) return d.pages.flatMap((p: any) => p.posts ?? []);
    return d.posts ?? [];
  }, [postsQuery.data]);

  const handleJoinToggle = async () => {
    if (!groupData) return;
    setJoining(true);
    try {
      if (isMember) {
        await leaveGroup(groupData.id);
        setIsMember(false);
        const user = await supabase.auth.getUser();
        console.log(user.data.user?.id);
        console.log(groupData.id);
      } else {
        await joinGroup(groupData.id);
        setIsMember(true);
      }
      // refresh posts or group data if needed
    } catch (err) {
      console.error('Join toggle failed', err);
    } finally {
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
          <Image source={{ uri: groupData.coverPhotoUrl }} style={styles.eventImage} />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}

        <View style={styles.header} pointerEvents='box-none'>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name='chevron-left' size={24} color='#fff' />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
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
          </TouchableOpacity>
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
    lineHeight:25,
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
