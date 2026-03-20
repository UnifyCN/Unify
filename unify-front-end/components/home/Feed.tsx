import React, { useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { LegendList } from '@legendapp/list';
import { PostData } from '@/types/feeds/post';
import { PostItem } from './PostItem';
import { SkeletonLoaderPostItem } from '@/components/SkeletonLoaderPostItem';
import { prefetchAvatarUrls } from '@/services/s3/avatarUrlCache';
import { prefetchPostImageUrls } from '@/services/s3/postImageUrlCache';

const INITIAL_VIEWPORT_COUNT = 6;
const DEFAULT_ESTIMATED_ITEM_SIZE = 420;
const HOME_CARD_ESTIMATED_ITEM_SIZE = 360;
const INITIAL_CONTAINER_POOL_RATIO = 3;

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
  const estimatedItemSize = isHomeCardVariant
    ? HOME_CARD_ESTIMATED_ITEM_SIZE
    : DEFAULT_ESTIMATED_ITEM_SIZE;
  const allPosts = useMemo(
    () => data?.pages?.flatMap((page: any) => page.posts) ?? [],
    [data]
  );

  useEffect(() => {
    if (!allPosts.length) {
      return;
    }

    const firstViewportPosts = allPosts.slice(0, INITIAL_VIEWPORT_COUNT);

    const firstViewportAvatarUrls = firstViewportPosts.map(
      (post: PostData) => post.user.profilePictureUrl
    );
    const firstViewportImageKeys = firstViewportPosts.flatMap(
      (post: PostData) => post.post_image_urls ?? []
    );

    void Promise.all([
      prefetchAvatarUrls(firstViewportAvatarUrls).catch(error => {
        console.warn('Failed to prefetch feed avatar URLs', error);
      }),
      prefetchPostImageUrls(firstViewportImageKeys).catch(error => {
        console.warn('Failed to prefetch feed post image URLs', error);
      }),
    ]);
  }, [allPosts]);

  const renderPost = useCallback(
    ({ item }: { item: PostData }) => {
      return <PostItem post={item} variant={postVariant} />;
    },
    [postVariant]
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
        <LegendList
          data={Array.from({ length: 3 }, (_, index) => index + 1)}
          keyExtractor={item => `skeleton-${item}`}
          renderItem={() => <SkeletonLoaderPostItem variant={postVariant} />}
          scrollEnabled={false}
          recycleItems={false}
          estimatedItemSize={estimatedItemSize}
          initialContainerPoolRatio={INITIAL_CONTAINER_POOL_RATIO}
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
    <LegendList
      data={allPosts}
      keyExtractor={item => item.id.toString()}
      renderItem={renderPost}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      onRefresh={refetch}
      refreshing={isFocused && !!isRefetching}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={
        isHomeCardVariant ? styles.homeCardListContent : undefined
      }
      ItemSeparatorComponent={isHomeCardVariant ? HomeCardSpacer : undefined}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.loadingFooter}>
            <SkeletonLoaderPostItem variant={postVariant} />
          </View>
        ) : null
      }
      recycleItems={false}
      estimatedItemSize={estimatedItemSize}
      initialContainerPoolRatio={INITIAL_CONTAINER_POOL_RATIO}
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
