import React from 'react';
import FeedWithHook from '@/components/FeedWithHook';
import { useGroupsFeed } from '@/hooks/feeds/useGroupsFeed';

interface GroupsFeedProps {
  ListEmptyComponent: React.ReactElement;
}

const GroupsFeed = ({ ListEmptyComponent }: GroupsFeedProps) => {
  return (
    <FeedWithHook
      useFeedHook={useGroupsFeed}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
};

export default GroupsFeed;
