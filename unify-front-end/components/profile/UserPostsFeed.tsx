import React from 'react';
import Feed from '@/components/home/Feed';
import { useUserPosts } from '@/hooks/posts/useUserPosts';

interface UserPostsFeedProps {
  userId: string;
  ListHeaderComponent: React.ReactElement;
  ListEmptyComponent: React.ReactElement;
}

const UserPostsFeed = ({
  userId,
  ListHeaderComponent,
  ListEmptyComponent,
}: UserPostsFeedProps) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useUserPosts(userId);

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

export default UserPostsFeed;
