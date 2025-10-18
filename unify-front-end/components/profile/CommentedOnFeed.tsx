import React from 'react';
import FeedWithHook from '@/components/FeedWithHook';
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
  return (
    <FeedWithHook
      useFeedHook={() => useCommentedOnFeed(userId)}
      {...(ListEmptyComponent && { ListEmptyComponent })}
      {...(ListHeaderComponent && { ListHeaderComponent })}
    />
  );
};

export default CommentedOnFeed;
