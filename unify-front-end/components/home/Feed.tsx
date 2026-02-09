import React, { useCallback, useEffect, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { PostData } from '@/types/feeds/post';
import { PostItem } from './PostItem';
import { SkeletonLoaderPostItem } from '@/components/SkeletonLoaderPostItem';
import { usePostMetadata } from '@/hooks/usePostMetadata';
import { prefetchAvatarUrls } from '@/services/s3/avatarUrlCache';

const HomeCardSpacer = () => <View style={styles.homeCardSpacer} />;

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
  postVariant?: 'default' | 'homeCard';
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
  postVariant = 'default',
}: FeedProps) => {
  const isFocused = useIsFocused();
  const isHomeCardVariant = postVariant === 'homeCard';
  const allPosts = useMemo(
    () => data?.pages?.flatMap((page: any) => page.posts) ?? [],
    [data]
  );

  useEffect(() => {
    if (!allPosts.length) {
      return;
    }

    const firstViewportAvatarUrls = allPosts
      .slice(0, 20)
      .map((post: PostData) => post.user.profilePictureUrl);

    prefetchAvatarUrls(firstViewportAvatarUrls).catch(error => {
      console.warn('Failed to prefetch feed avatar URLs', error);
    });
  }, [allPosts]);

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
          variant={postVariant}
        />
      );
    },
    [metadata, metadataLoading, postVariant]
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
          renderItem={() => (
            <SkeletonLoaderPostItem variant={postVariant} />
          )}
          scrollEnabled={false}
          contentContainerStyle={
            isHomeCardVariant ? styles.homeCardListContent : undefined
          }
          ItemSeparatorComponent={
            isHomeCardVariant ? HomeCardSpacer : undefined
          }
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
          refreshing={isFocused && (isRefetching || false)}
          onRefresh={refetch}
        />
      }
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={
        isHomeCardVariant ? styles.homeCardListContent : undefined
      }
      ItemSeparatorComponent={
        isHomeCardVariant ? HomeCardSpacer : undefined
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.loadingFooter}>
            <SkeletonLoaderPostItem variant={postVariant} />
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
  homeCardListContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 96,
  },
  homeCardSpacer: {
    height: 12,
  },
});

export default Feed;
