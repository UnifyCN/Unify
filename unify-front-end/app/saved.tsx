import { View, Text, StyleSheet } from 'react-native';
import BackHeader from '@/components/BackHeader';
import FeedWithHook from '@/components/FeedWithHook';
import { useGetSavedPosts } from '@/hooks/posts/useGetSavedPosts';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import UnifyReplyIcon from '@/components/icons/UnifyReply.svg';
import { Theme } from '@/constants/Theme';

export default function SavedPostsPage() {
  return (
    <View style={styles.container}>
      <BackHeader title='Saved Posts' />
      <FeedWithHook
        useFeedHook={useGetSavedPosts}
        ListEmptyComponent={
          <EmptyFeedMessage
            icon={<UnifyReplyIcon width={27} height={25} />}
            message='Looks a little quiet here...'
            submessage={
              <Text style={styles.emptyMessageSubtext}>
                Save posts to see them here
              </Text>
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  emptyMessageSubtext: {
    fontSize: 14,
    color: Theme.textInput,
    textAlign: 'center',
    lineHeight: 20,
  },
});
