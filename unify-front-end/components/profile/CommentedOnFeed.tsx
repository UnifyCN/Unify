import React from 'react';
import Feed from '../home/Feed';
import { useCommentedOnFeed } from '@/hooks/feeds/useCommentedOnFeed';

interface CommentedOnFeedProps {
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ReactElement;
  userId: string;
}

const CommentedOnFeed = ({
  ListHeaderComponent,
  ListEmptyComponent,
  userId,
}: CommentedOnFeedProps) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useCommentedOnFeed(userId);

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

export default CommentedOnFeed;
