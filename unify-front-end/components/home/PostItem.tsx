import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Like from '@/assets/images/Like.svg';
import Like_Fill from '@/assets/images/Like_filled.svg';
import Save from '@/assets/images/Save.svg';
import Save_Fill from '@/assets/images/Save_filled.svg';
import Comment from '@/assets/images/Comment.svg';
import { PostData } from '@/types/feeds/post';
import { useMutateLikePost } from '@/hooks/posts/useMutateLikePost';
import { useMutateSavePost } from '@/hooks/posts/useMutateSavePost';
import { formatSmartTime } from '@/utils/dateUtils';
import ChevronRight from '@/components/icons/PostHeaderIcon';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Avatar } from '@/components/Avatar';

interface PostItemProps {
  post: PostData;
  metadata?: {
    isLiked: boolean;
    isSaved: boolean;
    likeCount: number;
    commentCount: number;
  };
  isLoading?: boolean;
}

export const PostItem = memo(({ post, metadata, isLoading }: PostItemProps) => {
  const router = useRouter();

  // Use batch-loaded metadata (no individual queries needed)
  const likePostMutation = useMutateLikePost();
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

  // Use batch-loaded metadata
  const likeCount = metadata?.likeCount ?? 0;
  const isLiked = metadata?.isLiked;
  const isSaved = metadata?.isSaved;
  const commentCount = metadata?.commentCount ?? 0;

  return (
    <View>
      <View style={styles.postContainer}>
        {/* Avatar */}
        <TouchableOpacity
          style={styles.headshot}
          onPress={navigateToUserProfile}
        >
          <Avatar
            profilePictureUrl={post.user.profilePictureUrl}
            username={post.user.username}
            size={29}
          />
        </TouchableOpacity>
        {/* Post Content */}
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

          {/* Content */}
          <Text style={styles.description}>{post.content}</Text>

          {/* Footer */}
          <View style={styles.footer}>
            {isLoading ? (
              <SkeletonLoader
                width='100%'
                height={20}
                style={{ marginTop: 8 }}
              />
            ) : (
              <>
                <View style={styles.footerItem}>
                  <TouchableOpacity
                    onPress={() => {
                      if (isLiked !== undefined) {
                        toggleLike(post.id, isLiked);
                      }
                    }}
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
                  onPress={() => {
                    if (isSaved !== undefined) {
                      toggleSave(post.id, isSaved);
                    }
                  }}
                >
                  {isSaved ? (
                    <Save_Fill width={20} height={20} />
                  ) : (
                    <Save width={20} height={20} />
                  )}
                </TouchableOpacity>
              </>
            )}
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 25,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
