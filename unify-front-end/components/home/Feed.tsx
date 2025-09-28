import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { PostData } from '@/types/feeds/post';
import { PostItem } from './PostItem';

interface FeedProps {
  data?: any; // TODO: fix this
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  isRefetching?: boolean;
  refetch?: () => void;
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
}

const Feed = ({
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  isRefetching,
  refetch,
  ListHeaderComponent,
  ListEmptyComponent,
}: FeedProps) => {
  const allPosts = data?.pages?.flatMap((page: any) => page.posts) ?? [];

  const renderPost = ({ item }: { item: PostData }) => <PostItem post={item} />;

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingMessage}>Loading...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={allPosts}
      keyExtractor={item => item.id.toString()}
      renderItem={renderPost}
      contentContainerStyle={styles.feedContainer}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching || false}
          onRefresh={refetch}
        />
      }
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.loadingFooter}>
            <Text>Loading more...</Text>
          </View>
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  feedContainer: {},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  loadingMessage: {
    paddingTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});

export default Feed;
