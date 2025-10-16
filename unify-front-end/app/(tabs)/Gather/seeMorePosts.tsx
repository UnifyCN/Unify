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
    return <PostItem post={item} shouldHideContent={true} />;
  };

  return (
    <View style={styles.searchContainer}>
      <SearchHeader />

      <FlatList
        data={posts}
        renderItem={renderPosts}
        keyExtractor={(i: PostData) => String(i.id)}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    flex: 1,
    backgroundColor: '#ffffffff',
  },
});
