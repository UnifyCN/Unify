import React from 'react';
import FeedWithHook from '@/components/FeedWithHook';
import { useUserPosts } from '@/hooks/posts/useUserPosts';

interface UserPostsFeedProps {
  userId: string;
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ReactElement;
}

const UserPostsFeed = ({
  userId,
  ListHeaderComponent,
  ListEmptyComponent,
}: UserPostsFeedProps) => {
  return (
    <FeedWithHook
      useFeedHook={() => useUserPosts(userId)}
      {...(ListEmptyComponent && { ListEmptyComponent })}
      {...(ListHeaderComponent && { ListHeaderComponent })}
    />
  );
};

export default UserPostsFeed;
