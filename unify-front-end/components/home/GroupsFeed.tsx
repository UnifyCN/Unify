import React from 'react';
import Feed from './Feed';
import { useGroupsFeed } from '@/hooks/feeds/useGroupsFeed';

interface GroupsFeedProps {
  ListEmptyComponent: React.ReactElement;
}

const GroupsFeed = ({ ListEmptyComponent }: GroupsFeedProps) => {
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
      ListEmptyComponent={ListEmptyComponent}
    />
  );
};

export default GroupsFeed;
