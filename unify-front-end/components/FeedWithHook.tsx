import React from 'react';
import Feed from './home/Feed';

interface FeedWithHookProps {
  useFeedHook: () => {
    data: any;
    fetchNextPage: () => void;
    hasNextPage?: boolean;
    isFetchingNextPage: boolean;
    isLoading: boolean;
    isRefetching: boolean;
    refetch: () => void;
  };
  ListEmptyComponent?: React.ReactElement;
  ListHeaderComponent?: React.ReactElement;
  postVariant?: 'default' | 'homeCard';
}

const FeedWithHook = ({
  useFeedHook,
  ListEmptyComponent,
  ListHeaderComponent,
  postVariant = 'default',
}: FeedWithHookProps) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useFeedHook();

  return (
    <Feed
      data={data}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isLoading}
      isRefetching={isRefetching}
      refetch={refetch}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      postVariant={postVariant}
    />
  );
};

export default FeedWithHook;
