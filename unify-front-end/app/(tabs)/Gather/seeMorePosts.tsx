import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getAllPosts } from '@/services/posts/getAllPosts';
import { PostData } from '@/types/feeds/post';
import { Feather } from '@expo/vector-icons';
import { PostItem } from '@/components/home/PostItem';

export default function MorePostsScreen() {
  const { q } = useLocalSearchParams();
  const searchQuery = (q as string) ?? '';

  const { data: searchResults } = useQuery({
    queryKey: ['morePosts', searchQuery],
    queryFn: () => getAllPosts(undefined, 200, searchQuery),
    enabled: true,
  });

  const posts: PostData[] = searchResults?.posts ?? [];

  const renderPosts = ({ item }: { item: PostData }) => {
    return (
      <View style={styles.cardWrapper}>
        <PostItem post={item} shouldHideContent={true} />
      </View>
    );
  };

  return (
    <View
      style={[
        styles.searchContainer,
        { backgroundColor: '#ffffffff', paddingTop: 0 },
      ]}
    >
      <View style={[styles.header, { paddingTop: 0 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name='chevron-left' size={24} color='#000' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={posts}
        renderItem={renderPosts}
        keyExtractor={(i: PostData) => String(i.id)}
        contentContainerStyle={[
          styles.feedContainer,
          { paddingHorizontal: 0, alignItems: 'stretch' },
        ]}
        //ItemSeparatorComponent={() => <View style={styles.divider} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  cardWrapper: {
    width: '100%',
  },
  feedContainer: {
    paddingBottom: 44,
    marginBottom: 36,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 0,
    width: '100%',
    alignSelf: 'stretch',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 0,
    flex: 1,
  },
  post: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
