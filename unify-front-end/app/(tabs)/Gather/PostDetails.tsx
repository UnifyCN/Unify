import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { usePostCommentMetadata } from '@/hooks/usePostCommentMetadata';
import PostCommentItem from './PostCommentItem';
import { useGetPostComments } from '@/hooks/posts/useGetPostComments';
import { PostItem } from '@/components/home/PostItem';
import { useHeaderVisibility } from '@/components/HeaderVisibilityProvider';
import { Feather } from '@expo/vector-icons';
import { usePostMetadata } from '@/hooks/usePostMetadata';
import SendIcon from '@/components/icons/SendIcon.svg';
import { SkeletonLoaderPostItem } from '@/components/SkeletonLoaderPostItem';
import { Theme } from '@/constants/Theme';

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
const CommentInput = React.forwardRef<
  TextInput,
  {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    onSend: () => void;
    disabled: boolean;
  }
>(({ placeholder, value, onChangeText, onSend, disabled }, ref) => (
  <View style={styles.commentInputContainer}>
    <TextInput
      ref={ref}
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
      <View style={styles.sendIconContainer}>
        <SendIcon
          width={20}
          height={18}
          stroke={disabled ? Theme.textInactiveTab : Theme.white}
        />
      </View>
    </TouchableOpacity>
  </View>
));

export interface PostDetailsProps {
  isPost?: boolean;
}

const PostDetails = ({ isPost = true }: PostDetailsProps) => {
  // Get passed data
  const { post: postParam, focusReply: focusReplyParam } =
    useLocalSearchParams();

  const { setVisible } = useHeaderVisibility();
  useEffect(() => {
    setVisible(false);
  }, [setVisible]);

  const onBack = () => {
    setVisible(true);
    router.back();
  };

  // Reply text box
  const [commentTextBox, setCommentTextBox] = useState('');
  const [focusReply, setFocusReply] = useState(false);

  const [focusReplyTrigger, setFocusReplyTrigger] = useState(false);
  const replyInputRef = useRef<TextInput>(null);

  const handleFocusReply = () => {
    setFocusReplyTrigger(prev => !prev); // toggle to retrigger effect
  };

  useEffect(() => {
    setTimeout(() => {
      replyInputRef.current?.focus();
    }, 300);
  }, [focusReplyTrigger]);

  if (!postParam) {
    return <PostNotFound />;
  }

  // Parse the post string and type it as PostData
  const post: PostData = JSON.parse(postParam as string);

  // Router for navigation
  const router = useRouter();

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
  const { data: postCommentMetadata, isLoading: commentMetadataLoading } =
    usePostCommentMetadata(commentIds);

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
      <PostCommentItem
        comment={item}
        metadata={postCommentMetadata?.[item.id]}
        metadataLoading={commentMetadataLoading}
      />
    ),
    [postCommentMetadata, commentMetadataLoading]
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
              isPost={isPost}
              isTouchable={false}
              isInsidePostDetails={true}
              onFocusReply={handleFocusReply}
              metadata={{
                isLiked,
                isSaved,
                likeCount,
                commentCount,
              }}
              metadataLoading={postMetadataLoading}
            />

            <View style={styles.largeDivider} />
          </>
        }
        ListEmptyComponent={() => {
          if (commentsLoading) {
            return <CommentsLoadingState />;
          }
          return <CommentsEmptyState />;
        }}
      />

      <CommentInput
        ref={replyInputRef}
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
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    height: 44,
    backgroundColor: Theme.surfaceTextInput,
  },
  postMessageButton: {
    backgroundColor: Theme.primaryGatherRed,
    borderRadius: 50,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginLeft: 12,
  },
  postMessageButtonDisabled: {
    backgroundColor: '#E5E5E5',
    opacity: 0.6,
  },
  sendIconContainer: {
    width: 25,
    paddingLeft: 2,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
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

CommentInput.displayName = 'CommentInput';
export default PostDetails;
