import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { PostData } from '@/types/feeds/post';
import { PostItem } from './PostItem';
import { SkeletonLoaderPostItem } from '@/components/SkeletonLoaderPostItem';
import { usePostMetadata } from '@/hooks/usePostMetadata';

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

  const { data: metadata, isLoading: metadataLoading } = usePostMetadata(
    allPosts.map((post: PostData) => post.id)
  );

  const renderPost = useCallback(
    ({ item }: { item: PostData }) => {
      return (
        <PostItem
          post={item}
          metadata={metadata?.[item.id]}
          metadataLoading={metadataLoading}
          isPost={false}
        />
      );
    },
    [metadata, metadataLoading]
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading && allPosts.length === 0) {
    return (
      <View style={styles.container}>
        {ListHeaderComponent}
        <FlatList
          data={Array.from({ length: 3 }, (_, index) => index + 1)}
          keyExtractor={item => `skeleton-${item}`}
          renderItem={() => <SkeletonLoaderPostItem />}
          scrollEnabled={false}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={allPosts}
      keyExtractor={item => item.id.toString()}
      renderItem={renderPost}
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
            <SkeletonLoaderPostItem />
          </View>
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
});

export default Feed;
