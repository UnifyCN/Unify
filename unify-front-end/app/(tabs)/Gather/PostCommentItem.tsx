import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Like from '@/assets/images/Like.svg';
import Like_Fill from '@/assets/images/Like_filled.svg';
import Comment from '@/assets/images/Comment.svg';
import { formatSmartTime } from '@/utils/dateUtils';
import { useMutateLikeComment } from '@/hooks/posts/useMutateLikeComment';
import { memo } from 'react';
import { PostCommentData } from '@/types/feeds/postcomment';

interface PostCommentItemProps {
  comment: PostCommentData;
  metadata?: {
    isLiked: boolean;
    likeCount: number;
    // TODO: when replies to comments are implemented
    // replyCount: number
  };
  isLoading?: boolean;
}

const PostCommentItem = memo(({ comment, metadata }: PostCommentItemProps) => {
  // Hook for liking and unliking comments
  const likeCommentMutation = useMutateLikeComment();

  const toggleLike = (commentId: number, isLiked: boolean) => {
    likeCommentMutation.mutate({ commentId, isLiked });
  };

  const navigateToUserProfile = () => {
    router.push(`/(tabs)/Gather/Profile/profile?userId=${comment.user_id}`);
  };

  // Use batch-loaded metadata
  const likeCount = metadata?.likeCount ?? 0;
  const isLiked = metadata?.isLiked;

  return (
    <View>
      <View style={styles.postContainer}>
        {/* Headshot */}
        <TouchableOpacity
          style={styles.headshot}
          onPress={navigateToUserProfile}
        >
          {/* TODO: Get headshot image */}
          <Text>No headshot</Text>
        </TouchableOpacity>

        <View style={styles.postContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={navigateToUserProfile}>
              <Text style={styles.name}>{comment.username}</Text>
            </TouchableOpacity>
            <Text style={styles.time}>
              {formatSmartTime(comment.created_at)}
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{comment.content}</Text>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <TouchableOpacity
                onPress={() => toggleLike(comment.id, isLiked!)}
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
              <Text style={styles.footerText}>0</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.divider} />
    </View>
  );
});

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
});

export default PostCommentItem;
