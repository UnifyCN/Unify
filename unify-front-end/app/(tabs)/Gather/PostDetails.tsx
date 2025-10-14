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
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import Like from '@/assets/images/Like.svg';
import Like_Fill from '@/assets/images/Like_filled.svg';
import Save from '@/assets/images/Save.svg';
import Save_Fill from '@/assets/images/Save_filled.svg';
import Comment from '@/assets/images/Comment.svg';
import { useMutateLikePost } from '@/hooks/posts/useMutateLikePost';
import { useMutateSavePost } from '@/hooks/posts/useMutateSavePost';
import { formatSmartTime } from '@/utils/dateUtils';
import { PostData } from '@/types/feeds/post';
import ChevronRight from '@/components/icons/PostHeaderIcon';
import { useMutateCreateComment } from '@/hooks/posts/useMutateCreateComment';
import { Keyboard } from 'react-native';
import { PostCommentData } from '@/types/feeds/postcomment';
import { useCommentMetadata } from '@/hooks/useCommentMetadata';
import PostCommentItem from './PostCommentItem';
import { useGetPostComments } from '@/hooks/posts/useGetPostComments';

interface PostDetailsProps {
  data?: any; // TODO: fix this
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  isRefetching?: boolean;
  refetch?: () => void;
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
}

const PostDetails = ({
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isRefetching,
  refetch,
  ListEmptyComponent,
}: PostDetailsProps) => {
  // Get passed data
  const { post: postParam } = useLocalSearchParams();

  if (!postParam) {
    return (
      <View>
        <Text>Post not found.</Text>
      </View>
    );
  }

  // Parse the post string and type it as PostData
  const post: PostData = JSON.parse(postParam as string);

  // Router for navigation
  const router = useRouter();

  // Hooks for liking and saving posts
  const likePostMutation = useMutateLikePost();
  const savePostMutation = useMutateSavePost();

  // Reply text box
  const [commentTextBox, setCommentTextBox] = useState('');

  // Get likeCount, isLikedCount, commentCount, and isSaved as a parameter
  const {
    likeCount: likeCountParam,
    isLiked: isLikedParam,
    commentCount: commentCountParam,
    isSaved: isSavedParam,
  } = useLocalSearchParams<{
    likeCount: string;
    isLiked: string;
    commentCount: string;
    isSaved: string;
  }>();

  // Optimistic updates for likes
  const toggleLike = (postId: number, isLiked: boolean) => {
    setOptimisticIsLiked(!isLiked);
    setOptimisticLikeCount(prev => (isLiked ? prev - 1 : prev + 1));

    likePostMutation.mutate(
      { postId, isLiked },
      {
        onError: () => {
          // Revert optimistic update on error
          setOptimisticIsLiked(isLiked);
          setOptimisticLikeCount(prev => (isLiked ? prev + 1 : prev - 1));
        },
      }
    );
  };

  // Optimistic updates for saves
  const toggleSave = (postId: number, isSaved: boolean) => {
    setOptimisticIsSaved(!isSaved);

    savePostMutation.mutate(
      { postId, isSaved },
      {
        onError: () => {
          // Revert optimistic update on error
          setOptimisticIsSaved(isSaved);
        },
      }
    );
  };

  // Use passed parameters as initial state, then manage optimistic updates
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(
    likeCountParam ? parseInt(likeCountParam) : 0
  );
  const [optimisticIsLiked, setOptimisticIsLiked] = useState(
    isLikedParam === 'true'
  );
  const [optimisticCommentCount, setOptimisticCommentCount] = useState(
    commentCountParam ? parseInt(commentCountParam) : 0
  );
  const [optimisticIsSaved, setOptimisticIsSaved] = useState(
    isSavedParam === 'true'
  );

  // Use optimistic state for display
  const likeCount = optimisticLikeCount;
  const isLiked = optimisticIsLiked;
  const commentCount = optimisticCommentCount;
  const isSaved = optimisticIsSaved;

  // Comment ID's for batch loading
  const { data: commentsData } = useGetPostComments(post.id);
  const commentIds =
    commentsData?.map((comment: PostCommentData) => comment.id) ?? [];

  // Batch load metadata for those comments
  const { data: metadata, isLoading: metadataLoading } =
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
          setOptimisticCommentCount(prev => prev + 1);
          setCommentTextBox('');
          Keyboard.dismiss();
        },
      }
    );
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  };

  const navigateToUserProfile = () => {
    router.push(`/(tabs)/Gather/Profile/profile?userId=${post.user.id}`);
  };

  const renderPost = useCallback(
    ({ item }: { item: PostCommentData }) => (
      <PostCommentItem
        comment={item}
        metadata={metadata?.[item.id]}
        isLoading={metadataLoading}
      />
    ),
    [metadata, metadataLoading]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, paddingBottom: 60 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <Link href='/(tabs)/Gather/gather' asChild>
          <TouchableOpacity style={styles.backButton}>
            <Feather name='chevron-left' size={28} color='#343434' />
          </TouchableOpacity>
        </Link>
      </View>

      <FlatList
        data={commentsData}
        keyExtractor={item => item.id.toString()}
        renderItem={renderPost}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || false}
            onRefresh={refetch}
          />
        }
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.loadingFooter}>
              <Text>Loading more...</Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          <>
            {/* Post Content */}
            <View style={styles.postContainer}>
              {/* Head Shot */}
              <TouchableOpacity
                style={styles.headshot}
                onPress={navigateToUserProfile}
              >
                {/* TODO: Have to add default headshot */}
                {post.user.headshot ? (
                  <post.user.headshot />
                ) : (
                  <Text>No headshot</Text>
                )}
              </TouchableOpacity>

              <View style={styles.postContent}>
                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity onPress={navigateToUserProfile}>
                    <Text style={styles.name}>{post.user.name}</Text>
                  </TouchableOpacity>
                  <ChevronRight width={6} height={10} />
                  <Text style={styles.group}>{post.group}</Text>
                  <Text style={styles.time}>{formatSmartTime(post.time)}</Text>
                </View>

                {/* Title */}
                <View>
                  <Text style={styles.title}>{post.title}</Text>
                </View>

                {/* Reply */}
                {post.userReply && (
                  <View style={styles.replyContainer}>
                    <Text style={styles.time}>Replying to </Text>
                    <Text style={styles.replyUser}>{post.userReply}</Text>
                  </View>
                )}

                {/* Description */}
                <Text style={styles.description}>{post.content}</Text>

                {/* Footer */}
                <View style={styles.footer}>
                  <View style={styles.footerItem}>
                    <TouchableOpacity
                      onPress={() => toggleLike(post.id, isLiked!)}
                    >
                      {isLiked ? (
                        <Like_Fill width={20} height={20} />
                      ) : (
                        <Like width={20} height={20} />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.footerText}>{likeCount}</Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Comment width={20} height={20} fill='gray' />
                    <Text style={styles.footerText}>{commentCount}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleSave(post.id, isSaved!)}
                  >
                    {isSaved ? (
                      <Save_Fill width={20} height={20} />
                    ) : (
                      <Save width={20} height={20} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.largeDivider} />
          </>
        }
      />

      {/* Comment reply box */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder={`Reply to ${post.user.name}`}
          value={commentTextBox}
          onChangeText={setCommentTextBox}
        />
        <TouchableOpacity
          style={styles.postMessageButton}
          onPress={handleCreateComment}
        >
          <Feather name='send' size={20} color='white' />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 120,
    paddingBottom: 20,
    gap: 12,
  },
  postContent: {
    flex: 1,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 12,
    color: '#000',
    textAlign: 'left',
    gap: 5,
    lineHeight: 16,
  },
  headshot: {
    width: 29,
    height: 29,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  name: {
    fontWeight: '400',
  },
  group: {
    fontWeight: '600',
  },
  time: {
    fontSize: 10,
    color: '#9F9D9D',
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 22,
  },
  replyUser: {
    fontSize: 16,
    textAlign: 'left',
    color: '#FE0034',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  replyContainer: {
    flexDirection: 'row',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#343434',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    marginLeft: 4,
    fontSize: 14,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  largeDivider: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E5E5',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  postMessageButton: {
    backgroundColor: '#575757',
    borderRadius: 50,
    padding: 10,
    marginLeft: 8,
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
});

export default PostDetails;
