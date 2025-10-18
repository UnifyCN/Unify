import React from 'react';
import FeedWithHook from '@/components/FeedWithHook';
import { useForYouFeed } from '@/hooks/feeds/useForYouFeed';

interface ForYouFeedProps {
  ListEmptyComponent: React.ReactElement;
}

const ForYouFeed = ({ ListEmptyComponent }: ForYouFeedProps) => {
  return (
    <FeedWithHook
      useFeedHook={useForYouFeed}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
};

export default ForYouFeed;
