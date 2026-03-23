import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Keyboard,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { PostData } from '@/types/feeds/post';
import { getPostById } from '@/services/posts/getPostById';
import { useMutateCreateComment } from '@/hooks/posts/useMutateCreateComment';
import { PostCommentData } from '@/types/feeds/postcomment';
import { useCommentMetadata } from '@/hooks/useCommentMetadata';
import PostCommentItem from '../../app/(tabs)/Gather/PostCommentItem';
import { useGetPostComments } from '@/hooks/posts/useGetPostComments';
import { PostItem } from '@/components/home/PostItem';
import { usePostMetadata } from '@/hooks/usePostMetadata';
import SendIcon from '@/components/icons/SendIcon.svg';
import { SkeletonLoaderPostItem } from '@/components/SkeletonLoaderPostItem';
import { Theme } from '@/constants/Theme';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import UnifyReplyIcon from '@/components/icons/UnifyReply.svg';
import BackHeader from '@/components/BackHeader';
import LoadingScreen from '@/components/LoadingScreen';
import ImageViewerModal from '@/components/home/ImageViewerModal';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

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
      <View style={styles.sendIconContainer}>
        <SendIcon
          width={20}
          height={18}
          stroke={disabled ? Theme.textInactiveTab : Theme.white}
        />
      </View>
    </TouchableOpacity>
  </View>
);

const PostDetails = () => {
  const { post: postParam, postId: postIdParam } = useLocalSearchParams<{
    post?: string;
    postId?: string;
  }>();

  const router = useRouter();

  const onBack = () => {
    router.back();
  };

  const postId = postIdParam ? parseInt(postIdParam, 10) : undefined;
  const { data: fetchedPost, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostById(postId!),
    enabled: !!postId && !postParam,
  });

  const post: PostData | null = postParam
    ? (JSON.parse(postParam as string) as PostData)
    : (fetchedPost ?? null);

  // Image viewer state (rendered at screen level, outside FlatList)
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUrls, setViewerUrls] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const handleImageViewerOpen = useCallback(
    (urls: string[], index: number) => {
      setViewerUrls(urls);
      setViewerIndex(index);
      setViewerVisible(true);
    },
    []
  );

  // Call all hooks unconditionally (before any early return) to avoid "Rendered more hooks than during the previous render"
  const [commentTextBox, setCommentTextBox] = useState('');
  const postIds = post ? [post.id] : [];
  const { data: postMetadata, isLoading: postMetadataLoading } =
    usePostMetadata(postIds);
  const metadata = postMetadata?.[post?.id ?? 0];
  const { data: commentsData, isLoading: commentsLoading } = useGetPostComments(
    post?.id
  );
  const commentIds =
    commentsData?.map((comment: PostCommentData) => comment.id) ?? [];
  const { data: commentMetadata, isLoading: commentMetadataLoading } =
    useCommentMetadata(commentIds);
  const createCommentMutation = useMutateCreateComment();
  const { height: kbHeight } = useReanimatedKeyboardAnimation();
  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: kbHeight.value }],
  }));

  const likeCount = metadata?.likeCount ?? 0;
  const isLiked = metadata?.isLiked ?? false;
  const commentCount = metadata?.commentCount ?? 0;
  const isSaved = metadata?.isSaved ?? false;

  const renderPost = useCallback(
    ({ item }: { item: PostCommentData }) => (
      <PostCommentItem
        comment={item}
        metadata={commentMetadata?.[item.id]}
        metadataLoading={commentMetadataLoading}
        postAuthorId={post?.user?.id?.toString() ?? ''}
      />
    ),
    [commentMetadata, commentMetadataLoading, post?.user?.id]
  );

  // Early returns only after all hooks have been called
  if (!postParam && !postIdParam) {
    return <PostNotFound />;
  }

  if (postIdParam && !postParam) {
    if (isLoadingPost) {
      return <LoadingScreen />;
    }
    if (!post) {
      return <PostNotFound />;
    }
  }

  if (!post) {
    return <PostNotFound />;
  }

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

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <BackHeader onBack={onBack} />

      <FlatList
        data={commentsData}
        keyExtractor={item => item.id.toString()}
        renderItem={renderPost}
        contentContainerStyle={{ paddingBottom: 25 }}
        keyboardDismissMode='interactive'
        keyboardShouldPersistTaps='handled'
        automaticallyAdjustKeyboardInsets
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
              metadataLoading={postMetadataLoading}
              isAbleToDelete={false}
              onImageViewerOpen={handleImageViewerOpen}
            />

            <View style={styles.largeDivider} />
          </>
        }
        ListEmptyComponent={() => {
          if (commentsLoading) {
            return <CommentsLoadingState />;
          }
          return (
            <View style={[{ paddingTop: 20 }]}>
              <EmptyFeedMessage
                icon={<UnifyReplyIcon width={27} height={25} />}
                message='Looks a little quiet here...'
                submessage={
                  <Text
                    style={{
                      fontSize: 14,
                      color: Theme.textInput,
                      textAlign: 'center',
                      lineHeight: 20,
                    }}
                  >
                    Be the first one to comment!
                  </Text>
                }
              />
            </View>
          );
        }}
      />

      <Animated.View style={[styles.commentInputSafeArea, inputAnimatedStyle]}>
        <CommentInput
          placeholder={`Reply to ${post.user.name}`}
          value={commentTextBox}
          onChangeText={setCommentTextBox}
          onSend={handleCreateComment}
          disabled={commentTextBox.trim() === ''}
        />
      </Animated.View>

      {viewerUrls.length > 0 && (
        <ImageViewerModal
          visible={viewerVisible}
          imageUrls={viewerUrls}
          initialIndex={viewerIndex}
          onClose={() => {
            setViewerVisible(false);
            StatusBar.setBarStyle('dark-content');
          }}
          author={{
            username: post.user.username ?? post.user.name,
            profilePictureUrl: post.user.profilePictureUrl,
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  },
  commentInputSafeArea: {
    backgroundColor: '#fff',
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

export default PostDetails;
