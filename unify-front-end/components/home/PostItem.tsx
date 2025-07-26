import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

interface PostItemProps {
  post: PostData;
}

export const PostItem = ({ post }: PostItemProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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

  // Use like data from the hook, fallback to 0 if loading
  const likeCount = likeData?.likeCount;
  const isLiked = likeData?.userLiked;

  // Use save data from the hook, fallback to post data if loading
  const isSaved = saveData?.saved;

  return (
    <View>
      <View style={styles.postContainer}>
        {/* Head Shot */}
        <View style={styles.headshot}>
          {/* TODO: Have to add default headshot */}
          {post.user.headshot ? (
            <post.user.headshot />
          ) : (
            <Text>No headshot</Text>
          )}
        </View>
        {/* Post Content */}
        <View style={styles.postContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.name}>{post.user.name}</Text>
            <Text style={styles.time}>{formatSmartTime(post.time)}</Text>
          </View>

          {post.userReply && (
            <View style={styles.replyContainer}>
              <Text style={styles.time}>Replying to </Text>
              <Text style={styles.replyUser}>{post.userReply}</Text>
            </View>
          )}

          {/* Description */}
          <Text style={styles.description}>{post.description}</Text>

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
        </View>
      </View>
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: '#fff',
    elevation: 3,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  postContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headshot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  name: {
    fontWeight: '600',
    textAlign: 'left',
    fontSize: 16,
  },
  time: {
    fontSize: 16,
    textAlign: 'left',
    color: '#999999',
  },
  replyUser: {
    fontSize: 16,
    textAlign: 'left',
    color: '#FE0034',
  },
  description: {
    fontSize: 16,
    lineHeight: 20,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    flex: 1,
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
  replyContainer: {
    flexDirection: 'row',
  },
});
