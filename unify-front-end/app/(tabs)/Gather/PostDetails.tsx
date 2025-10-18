import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  TextInput,
  Platform,
  FlatList,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PostData } from '@/types/feeds/post';
import { useMutateCreateComment } from '@/hooks/posts/useMutateCreateComment';
import { PostCommentData } from '@/types/feeds/postcomment';
import { useCommentMetadata } from '@/hooks/useCommentMetadata';
import PostCommentItem from './PostCommentItem';
import { useGetPostComments } from '@/hooks/posts/useGetPostComments';
import { PostItem } from '@/components/home/PostItem';
import { useHeaderVisibility } from '@/components/HeaderVisibilityProvider';
import { useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { usePostMetadata } from '@/hooks/usePostMetadata';
import { SkeletonLoaderPostItem } from '@/components/SkeletonLoaderPostItem';

// Header component
const PostDetailsHeader = ({ onBack }: { onBack: () => void }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerContent}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Feather name='chevron-left' size={24} color='#343434' />
      </TouchableOpacity>
    </View>
  </View>
);

// Loading state component
const CommentsLoadingState = () => (
  <View style={styles.commentsLoadingContainer}>
    {Array.from({ length: 3 }, (_, index) => (
      <SkeletonLoaderPostItem
        key={index + 1}
        avatarSize={29}
        showFooter={false}
      />
    ))}
  </View>
);

// Empty state component
const CommentsEmptyState = () => (
  <View style={styles.emptyState}>
    <View style={styles.emptyStateContent}>
      <Feather name='message-circle' size={48} color='#D1D1D6' />
      <Text style={styles.emptyStateTitle}>No comments yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Be the first to start the conversation
      </Text>
    </View>
  </View>
);

// Error component
const PostNotFound = () => (
  <View style={styles.errorContainer}>
    <Text>Post not found.</Text>
  </View>
);

// Comment input component
const CommentInput = ({
  placeholder,
  value,
  onChangeText,
  onSend,
  disabled,
}: {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
}) => (
  <View style={styles.commentInputContainer}>
    <TextInput
      style={styles.commentInput}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
    />
    <TouchableOpacity
      style={[
        styles.postMessageButton,
        disabled && styles.postMessageButtonDisabled,
      ]}
      onPress={onSend}
      disabled={disabled}
    >
      <Feather name='send' size={20} color={disabled ? '#999' : 'white'} />
    </TouchableOpacity>
  </View>
);

const PostDetails = () => {
  // Get passed data
  const { post: postParam } = useLocalSearchParams();

  const { setVisible } = useHeaderVisibility();
  useEffect(() => {
    setVisible(false);
  }, [setVisible]);

  const onBack = () => {
    setVisible(true);
    router.back();
  };

  if (!postParam) {
    return <PostNotFound />;
  }

  // Parse the post string and type it as PostData
  const post: PostData = JSON.parse(postParam as string);

  // Router for navigation
  const router = useRouter();

  // Reply text box
  const [commentTextBox, setCommentTextBox] = useState('');

  // Get post metadata from query cache (supports optimistic updates)
  const { data: postMetadata, isLoading: postMetadataLoading } =
    usePostMetadata([post.id]);
  const metadata = postMetadata?.[post.id];

  // Use metadata from query cache
  const {
    likeCount = 0,
    isLiked = false,
    commentCount = 0,
    isSaved = false,
  } = metadata ?? {};

  // Comment ID's for batch loading
  const { data: commentsData, isLoading: commentsLoading } = useGetPostComments(
    post.id
  );
  const commentIds =
    commentsData?.map((comment: PostCommentData) => comment.id) ?? [];

  // Batch load metadata for those comments
  const { data: commentMetadata, isLoading: commentMetadataLoading } =
    useCommentMetadata(commentIds);

  const createCommentMutation = useMutateCreateComment();

  const handleCreateComment = () => {
    if (commentTextBox.trim() === '') return;
    createCommentMutation.mutate(
      {
        postId: post.id,
        content: commentTextBox,
      },
      {
        onSuccess: () => {
          setCommentTextBox('');
          Keyboard.dismiss();
        },
      }
    );
  };

  // Note: Pagination can be added later if needed

  const renderPost = useCallback(
    ({ item }: { item: PostCommentData }) => (
      <PostCommentItem comment={item} metadata={commentMetadata?.[item.id]} metadataLoading={commentMetadataLoading} />
    ),
    [commentMetadata, commentMetadataLoading]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, paddingBottom: 60, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <PostDetailsHeader onBack={onBack} />

      <FlatList
        data={commentsData}
        keyExtractor={item => item.id.toString()}
        renderItem={renderPost}
        contentContainerStyle={{ paddingTop: 80, paddingBottom: 25 }}
        ListHeaderComponent={
          <>
            <PostItem
              post={post}
              metadata={{
                isLiked,
                isSaved,
                likeCount,
                commentCount,
              }}
              metadataLoading={commentMetadataLoading}
            />

            <View style={styles.largeDivider} />
          </>
        }
        ListEmptyComponent={() => {
          if (commentsLoading || commentMetadataLoading) {
            return <CommentsLoadingState />;
          }
          return <CommentsEmptyState />;
        }}
      />

      <CommentInput
        placeholder={`Reply to ${post.user.name}`}
        value={commentTextBox}
        onChangeText={setCommentTextBox}
        onSend={handleCreateComment}
        disabled={commentTextBox.trim() === ''}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#fff',
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeDivider: {
    width: '100%',
    height: 2,
    backgroundColor: '#E5E5E5',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    height: 44,
    backgroundColor: '#D9D9D9',
  },
  postMessageButton: {
    backgroundColor: '#575757',
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
    padding: 10,
    marginLeft: 12,
  },
  postMessageButtonDisabled: {
    backgroundColor: '#E5E5E5',
    opacity: 0.6,
  },
  commentsLoadingContainer: {
    backgroundColor: '#fff',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default PostDetails;
