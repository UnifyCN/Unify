import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { PostData } from "@/types/feeds/post";
import { PostItem } from "./PostItem";

interface FeedProps {
  data?: any; // TODO: fix this
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  isRefetching?: boolean;
  refetch?: () => void;
}

export const Feed = ({ 
  data, 
  fetchNextPage, 
  hasNextPage, 
  isFetchingNextPage, 
  isLoading, 
  isRefetching, 
  refetch 
}: FeedProps) => {
  const allPosts = data?.pages?.flatMap((page: any) => page.posts) ?? [];

  const renderPost = ({ item }: { item: PostData }) => (
    <PostItem post={item} />
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={updatedPosts}
      keyExtractor={(item) => item.id.toString()}
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingFooter: {
    padding: 20,
    alignItems: "center",
  },
});

export default Feed;
