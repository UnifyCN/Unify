import React from 'react';
import Feed from './Feed';
import { useForYouFeed } from '@/hooks/feeds/useForYouFeed';

interface ForYouFeedProps {
  ListEmptyComponent: React.ReactElement;
}

const ForYouFeed = ({ ListEmptyComponent }: ForYouFeedProps) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useForYouFeed();

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
    />
  );
};

export default ForYouFeed;
