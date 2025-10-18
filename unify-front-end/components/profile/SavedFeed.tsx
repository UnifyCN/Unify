import React from 'react';
import FeedWithHook from '@/components/FeedWithHook';
import { useGetSavedPosts } from '@/hooks/posts/useGetSavedPosts';

interface SavedFeedProps {
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ReactElement;
}

const SavedFeed = ({
  ListHeaderComponent,
  ListEmptyComponent,
}: SavedFeedProps) => {
  return (
    <FeedWithHook
      useFeedHook={useGetSavedPosts}
      {...(ListEmptyComponent && { ListEmptyComponent })}
      {...(ListHeaderComponent && { ListHeaderComponent })}
    />
  );
};

export default SavedFeed;
