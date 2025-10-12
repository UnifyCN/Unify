import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, TextInput, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import Like from '@/assets/images/Like.svg';
import Like_Fill from '@/assets/images/Like_filled.svg';
import Save from '@/assets/images/Save.svg';
import Save_Fill from '@/assets/images/Save_filled.svg';
import Comment from '@/assets/images/Comment.svg';
import { useGetPostLikes } from '@/hooks/posts/useGetPostLikes';
import { useMutateLikePost } from '@/hooks/posts/useMutateLikePost';
import { useGetPostSaveStatus } from '@/hooks/posts/useGetPostSaveStatus';
import { useMutateSavePost } from '@/hooks/posts/useMutateSavePost';
import { formatSmartTime } from '@/utils/dateUtils';
import { PostData } from '@/types/feeds/post';
import ChevronRight from '@/components/icons/PostHeaderIcon';
import { useGetPostComments } from '@/hooks/posts/useGetPostComments';
import PostCommentItem from '@/components/posts/PostCommentItem';
import { useMutateCreateComment } from '@/hooks/posts/useMutateCreateComment';
import { Keyboard } from 'react-native';

export default function PostDetails() {
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

  // Get post likes data
  const { data: likeData } = useGetPostLikes(post.id);
  const likePostMutation = useMutateLikePost();

  // Get post save status
  const { data: saveData } = useGetPostSaveStatus(post.id);
  const savePostMutation = useMutateSavePost();

  // Fetch comments
  const { data: comments, isLoading, isError } = useGetPostComments(post.id);

  // Reply text box
  const [commentTextBox, setCommentTextBox] = useState('');

  const toggleLike = (postId: number, isLiked: boolean) => {
    likePostMutation.mutate({ postId, isLiked });
  };

  const toggleSave = (postId: number, isSaved: boolean) => {
    savePostMutation.mutate({ postId, isSaved });
  };

  // Use like data from the hook, fallback to 0 if loading
  const likeCount = likeData?.likeCount;
  const isLiked = likeData?.userLiked;

  // Use save data from the hook, fallback to post data if loading
  const isSaved = saveData?.saved;

  const navigateToUserProfile = () => {
    router.push(`/(tabs)/Gather/Profile/profile?userId=${post.user.id}`);
  };

  const createCommentMutation = useMutateCreateComment();

  const handleCreateComment = () => {
    if (commentTextBox.trim() === '') return;
    createCommentMutation.mutate({
      postId: post.id,
      content: commentTextBox,
    },
    { onSuccess: () => {
        setCommentTextBox('');
        Keyboard.dismiss();
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"   
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Link href='/(tabs)/Gather/gather' asChild>
            <TouchableOpacity style={styles.backButton}>
              <Feather name='chevron-left' size={28} color='#343434' />
            </TouchableOpacity>
          </Link>
        </View>
        <View style={styles.divider} />

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
                <TouchableOpacity onPress={() => toggleLike(post.id, isLiked!)}>
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
                <Text style={styles.footerText}>0</Text>
              </View>
              <TouchableOpacity onPress={() => toggleSave(post.id, isSaved!)}>
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

        {comments?.length ? (
          comments.map(comment => (
            <React.Fragment key={comment.id}>
              <PostCommentItem comment={comment} />
              <View style={styles.divider} />
            </React.Fragment>
          ))
        ) : (
          <Text>No comments</Text>
        )}
      </ScrollView>

      {/* Comment reply box */}
      <View style={styles.commentInputContainer}>
          <TextInput
              style={styles.commentInput}
              placeholder={`Reply to ${post.user.name}`}
              value={commentTextBox}
              onChangeText={setCommentTextBox}
          />
          <TouchableOpacity style={styles.postMessageButton} onPress={handleCreateComment}>
          <Feather name="send" size={20} color="white" />
          </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 22,
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
    paddingTop: 60, // same as paddingTop defined in <Header> component
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
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
});
