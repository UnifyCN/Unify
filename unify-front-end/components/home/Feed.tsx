import React, { useCallback, useMemo } from 'react';
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
  // Memoize allPosts to avoid recalculating on every render
  const allPosts = useMemo(
    () => data?.pages?.flatMap((page: any) => page.posts) ?? [],
    [data?.pages]
  );

  // Memoize post IDs array to avoid creating new array reference on every render
  const postIds = useMemo(
    () => allPosts.map((post: PostData) => post.id),
    [allPosts]
  );

  const { data: metadata, isLoading: metadataLoading } = usePostMetadata(postIds);

  // Memoize renderPost callback with stable dependencies
  const renderPost = useCallback(
    ({ item }: { item: PostData }) => {
      return (
        <PostItem
          post={item}
          metadata={metadata?.[item.id]}
          metadataLoading={metadataLoading}
        />
      );
    },
    [metadata, metadataLoading]
  );

  // Memoize handleLoadMore to avoid recreating on every render
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Memoize contentContainerStyle to avoid recreating object on every render
  const contentContainerStyle = useMemo(
    () =>
      allPosts.length === 0 && ListEmptyComponent
        ? styles.emptyContentContainer
        : undefined,
    [allPosts.length, ListEmptyComponent]
  );

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

  // Memoize keyExtractor to avoid recreating function on every render
  const keyExtractor = useCallback(
    (item: PostData) => item.id.toString(),
    []
  );

  return (
    <FlatList
      data={allPosts}
      keyExtractor={keyExtractor}
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
      contentContainerStyle={contentContainerStyle}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
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
  emptyContentContainer: {
    flexGrow: 1,
  },
});

export default Feed;
