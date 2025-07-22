import React from 'react';
import Feed from './Feed';
import { useGroupsFeed } from '@/hooks/feeds/useGroupsFeed';

const GroupsFeed = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useGroupsFeed();

  return (
    <Feed
      data={data}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isLoading}
      isRefetching={isRefetching}
      refetch={refetch}
    />
  );
};

export default GroupsFeed;
