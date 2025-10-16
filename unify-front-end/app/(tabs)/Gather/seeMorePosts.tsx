import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getAllPosts } from '@/services/posts/getAllPosts';
import { PostData } from '@/types/feeds/post';
import { PostItem } from '@/components/home/PostItem';
import { SearchHeader } from '@/components/SearchHeader';

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
      <SearchHeader />

      <FlatList
        data={posts}
        renderItem={renderPosts}
        keyExtractor={(i: PostData) => String(i.id)}
        contentContainerStyle={styles.feedContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
  },
  feedContainer: {
    paddingBottom: 44,
    marginBottom: 36,
    paddingHorizontal: 0,
    alignItems: 'stretch',
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
