import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
import { PostItemProps } from '@/components/home/PostItem';
import { formatSmartTime } from '@/utils/dateUtils';
import { PostData } from '@/types/feeds/post';

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Link href='/(tabs)/Gather/gather' asChild>
          <TouchableOpacity style={styles.backButton}>
            <Feather name='chevron-left' size={28} color='#343434' />
          </TouchableOpacity>
        </Link>
        <Text style={styles.headerTitle}>Post</Text>
      </View>

      {/* Post Content */}
      <View style={styles.postContainer}>
        {/* Headshot */}
        <View style={styles.headshot}>
          {post.user.headshot ? (
            <post.user.headshot />
          ) : (
            <Text>No headshot</Text>
          )}
        </View>

        <View style={styles.postContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.name}>{post.user.name}</Text>
            <Text style={styles.time}>{formatSmartTime(post.time)}</Text>
          </View>

          {/* Reply */}
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

      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  postContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  postContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontWeight: '600',
    fontSize: 16,
  },
  time: {
    fontSize: 14,
    color: '#999',
  },
  replyContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  replyUser: {
    fontSize: 14,
    color: '#FE0034',
  },
  description: {
    fontSize: 16,
    lineHeight: 20,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
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
    height: 5,
    backgroundColor: '#E5E5E5',
    marginTop: 24,
  },
});
