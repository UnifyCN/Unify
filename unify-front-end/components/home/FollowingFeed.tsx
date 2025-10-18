import React from 'react';
import FeedWithHook from '@/components/FeedWithHook';
import { useFollowingFeed } from '@/hooks/feeds/useFollowingFeed';

interface FollowingFeedProps {
  ListEmptyComponent: React.ReactElement;
}

const FollowingFeed = ({ ListEmptyComponent }: FollowingFeedProps) => {
  return (
    <FeedWithHook
      useFeedHook={useFollowingFeed}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
};

export default FollowingFeed;
