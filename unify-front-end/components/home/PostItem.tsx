import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useRouter } from 'expo-router';
import Like from '@/assets/images/Like.svg';
import Like_Fill from '@/assets/images/Like_filled.svg';
import Save from '@/assets/images/Save.svg';
import Save_Fill from '@/assets/images/Save_filled.svg';
import Comment from '@/assets/images/Comment.svg';
import { PostData } from '@/types/feeds/post';
import { useGetPostLikes } from '@/hooks/posts/useGetPostLikes';
import { useMutateLikePost } from '@/hooks/posts/useMutateLikePost';
import { useGetPostSaveStatus } from '@/hooks/posts/useGetPostSaveStatus';
import { useMutateSavePost } from '@/hooks/posts/useMutateSavePost';
import { formatSmartTime } from '@/utils/dateUtils';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import ChevronRight from '@/components/icons/PostHeaderIcon';

export interface PostItemProps {
  post: PostData;
}

export const PostItem = ({ post }: PostItemProps) => {
  // Router for navigation
  const router = useRouter();

  // Get post likes data
  const { data: likeData } = useGetPostLikes(post.id);
  const likePostMutation = useMutateLikePost();

  // Get post save status
  const { data: saveData } = useGetPostSaveStatus(post.id);
  const savePostMutation = useMutateSavePost();

  const toggleLike = (postId: number, isLiked: boolean) => {
    likePostMutation.mutate({ postId, isLiked });
  };

  const toggleSave = (postId: number, isSaved: boolean) => {
    savePostMutation.mutate({ postId, isSaved });
  };

  const navigateToUserProfile = () => {
    router.push(`/(tabs)/Gather/Profile/profile?userId=${post.user.id}`);
  };

  const navigateToUserProfile = () => {
    router.push(`/(tabs)/Gather/Profile/profile?userId=${post.user.id}`);
  };

  // Use like data from the hook, fallback to 0 if loading
  const likeCount = likeData?.likeCount;
  const isLiked = likeData?.userLiked;

  // Use save data from the hook, fallback to post data if loading
  const isSaved = saveData?.saved;

  return (
    <View>
      <View style={styles.postContainer}>
        {/* Head Shot */}
        <TouchableOpacity
          style={styles.headshot}
          onPress={navigateToUserProfile}
        >
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
        </TouchableOpacity>
        {/* Post Content */}
        <TouchableOpacity
          style={styles.postContent}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/Gather/PostDetails',
              params: { post: JSON.stringify(post) },
            })
          }
        >
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
            {/* {post.userReply && (
            <View style={styles.replyContainer}>
              <Text style={styles.time}>Replying to </Text>
              <Text style={styles.replyUser}>{post.userReply}</Text>
            </View>
          )}  */}
          )}  */}

            {/* Content */}
            <Text style={styles.description}>{post.content}</Text>
          </View>

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
              <Text style={styles.footerText}>
                {/* TODO: make fetch to get comment_count from posts table */}0
              </Text>
            </View>
            <TouchableOpacity onPress={() => toggleSave(post.id, isSaved!)}>
              {isSaved ? (
                <Save_Fill width={20} height={20} />
              ) : (
                <Save width={20} height={20} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 12,
    paddingVertical: 22,
    gap: 12,
  },
  postContent: {
    flex: 1,
    gap: 10,
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
    fontSize: 12,
    color: '#000',
    textAlign: 'left',
    gap: 5,
    lineHeight: 16,
  },
  headshot: {
    width: 29,
    height: 29,
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
    fontSize: 10,
    color: '#9F9D9D',
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 22,
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
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 25,
    gap: 25,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    gap: 4,
  },
  footerText: {
    fontSize: 14,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  replyContainer: {
    flexDirection: 'row',
  },
});
