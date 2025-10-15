import React from 'react';
import Feed from '../home/Feed';
import { useGetSavedPosts } from '@/hooks/posts/useGetSavedPosts';

interface SavedFeedProps {
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ReactElement;
}

const SavedFeed = ({
  ListHeaderComponent,
  ListEmptyComponent,
}: SavedFeedProps) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useGetSavedPosts();

  return (
    <Feed
      data={data}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isLoading}
      isRefetching={isRefetching}
      refetch={refetch}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
};

export default SavedFeed;
