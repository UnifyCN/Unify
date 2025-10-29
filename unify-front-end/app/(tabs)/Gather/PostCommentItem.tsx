import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Like from '@/assets/images/Like.svg';
import Like_Fill from '@/assets/images/Like_filled.svg';
import { formatSmartTime } from '@/utils/dateUtils';
import { useMutateLikeComment } from '@/hooks/posts/useMutateLikeComment';
import { memo, useCallback } from 'react';
import { PostCommentData } from '@/types/feeds/postcomment';
import { Avatar } from '@/components/Avatar';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Theme } from '@/constants/Theme';

interface PostCommentItemProps {
  comment: PostCommentData;
  metadata?: {
    isLiked: boolean;
    likeCount: number;
    // TODO: when replies to comments are implemented
    // replyCount: number
  };
  metadataLoading?: boolean;
}

const PostCommentItem = memo(
  ({ comment, metadata, metadataLoading }: PostCommentItemProps) => {
    // Hook for liking and unliking comments
    const likeCommentMutation = useMutateLikeComment();

    const toggleLike = useCallback(
      (commentId: number, isLiked: boolean) => {
        likeCommentMutation.mutate({ commentId, isLiked });
      },
      [likeCommentMutation]
    );

    const navigateToUserProfile = useCallback(() => {
      router.push(`/(tabs)/Gather/Profile/profile?userId=${comment.user_id}`);
    }, [comment.user_id]);

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
            <Avatar
              profilePictureUrl={comment.profilePictureUrl}
              username={comment.username}
              size={29}
            />
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
              <>
                <View style={styles.footerItem}>
                  <TouchableOpacity
                    onPress={() => {
                      if (isLiked !== undefined && !metadataLoading) {
                        toggleLike(comment.id, isLiked);
                      }
                    }}
                    disabled={metadataLoading}
                  >
                    {isLiked ? (
                      <Like_Fill width={20} height={20} />
                    ) : (
                      <Like width={20} height={20} />
                    )}
                  </TouchableOpacity>
                  {metadataLoading ? (
                    <SkeletonLoader width={24} height={20} />
                  ) : (
                    <Text style={styles.footerText}>{likeCount}</Text>
                  )}
                </View>
              </>
            </View>
          </View>
        </View>
        <View style={styles.divider} />
      </View>
    );
  }
);

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
    fontSize: 12,
    color: Theme.black,
  },
  time: {
    paddingTop: 2,
    fontSize: 10,
    color: Theme.textPostTime,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default PostCommentItem;
