import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BackHeader from '@/components/BackHeader';
import FeedWithHook from '@/components/FeedWithHook';
import { useGetSavedPosts } from '@/hooks/posts/useGetSavedPosts';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import UnifyReplyIcon from '@/components/icons/UnifyReply.svg';
import SavedHighlightsList from '@/components/learn/SavedHighlightsList';
import { Theme } from '@/constants/Theme';

type SavedTab = 'posts' | 'highlights';

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState<SavedTab>('posts');

  return (
    <View style={styles.container}>
      <BackHeader title="Saved" />

      {/* Segment control */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'posts' && styles.segmentActive]}
          onPress={() => setActiveTab('posts')}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'posts' && styles.segmentTextActive,
            ]}
          >
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'highlights' && styles.segmentActive]}
          onPress={() => setActiveTab('highlights')}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'highlights' && styles.segmentTextActive,
            ]}
          >
            Highlights
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      {activeTab === 'posts' ? (
        <FeedWithHook
          useFeedHook={useGetSavedPosts}
          ListEmptyComponent={
            <EmptyFeedMessage
              icon={<UnifyReplyIcon width={27} height={25} />}
              message="Looks a little quiet here..."
              submessage={
                <Text style={styles.emptyMessageSubtext}>
                  Save posts to see them here
                </Text>
              }
            />
          }
        />
      ) : (
        <SavedHighlightsList />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: Theme.surfaceGray,
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.textInput,
  },
  segmentTextActive: {
    color: Theme.black,
  },
  emptyMessageSubtext: {
    fontSize: 14,
    color: Theme.textInput,
    textAlign: 'center',
    lineHeight: 20,
  },
});
