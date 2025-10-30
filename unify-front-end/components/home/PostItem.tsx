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
import { Avatar } from '@/components/Avatar';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Theme } from '@/constants/Theme';

export interface PostItemProps {
  post: PostData;
  isPost?: boolean;
  isTouchable?: boolean;
  shouldHideContent?: boolean;
  metadata?: {
    isLiked: boolean;
    isSaved: boolean;
    likeCount: number;
    commentCount: number;
  };
  metadataLoading?: boolean;
}

export const PostItem = memo(
  ({ post, metadata, shouldHideContent, metadataLoading, isPost = true, isTouchable = true }: PostItemProps) => {
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

    // Use batch-loaded metadata with loading state
    const likeCount = metadata?.likeCount ?? 0;
    const isLiked = metadata?.isLiked ?? false;
    const isSaved = metadata?.isSaved ?? false;
    const commentCount = metadata?.commentCount ?? 0;

    // Show loading state for metadata if it's still loading
    const showMetadataLoading = metadataLoading && !metadata;

    // For rendering the content of the post
    const postContent = (
      <>
        {/* Head Shot */}
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
            <ChevronRight color={Theme.black} width={6} height={12} />
            {post.group ? (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/Gather/GroupDetailScreen' as any,
                    params: { groupName: post.group },
                  })
                }
              >
                <Text style={styles.group}>{post.group}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.group}>No group</Text>
            )}
            <Text style={styles.time}>{formatSmartTime(post.time)}</Text>
          </View>

          {/* Title */}
          <View>
            <Text style={styles.title}>{post.title}</Text>
          </View>

          {/* Content */}
          {!shouldHideContent && (
            <Text style={styles.description}>{post.content}</Text>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <TouchableOpacity
                onPress={() => {
                  if (isLiked !== undefined && !showMetadataLoading) {
                    toggleLike(post.id, isLiked);
                  }
                }}
                disabled={showMetadataLoading}
              >
                {isLiked ? (
                  <Like_Fill width={20} height={20} />
                ) : (
                  <Like width={20} height={20} />
                )}
              </TouchableOpacity>
              {showMetadataLoading ? (
                <SkeletonLoader width={20} height={14} />
              ) : (
                <Text style={styles.footerText}>{likeCount}</Text>
              )}
            </View>
            <View
              style={styles.footerItem}
            >
              <Comment width={20} height={20} fill='gray' />
              {showMetadataLoading ? (
                <SkeletonLoader width={24} height={20} />
              ) : (
                <Text style={styles.footerText}>{commentCount}</Text>
              )}
            </View>
            {isPost ? (
              <TouchableOpacity
                onPress={() => {
                  if (isSaved !== undefined && !showMetadataLoading) {
                    toggleSave(post.id, isSaved);
                  }
                }}
                disabled={showMetadataLoading}
              >
                {showMetadataLoading ? (
                  <SkeletonLoader width={20} height={20} borderRadius={4} />
                ) : isSaved ? (
                  <Save_Fill width={20} height={20} />
                ) : (
                  <Save width={20} height={20} />
                )}
              </TouchableOpacity>
            ) : ( <></> )}
          </View>
        </View>
      </>
    );

    return (
      <View>
        { isTouchable ? (
          <TouchableOpacity
            style={[
              styles.postContainer,
              { paddingHorizontal: shouldHideContent ? 0 : 20 },
            ]}
            onPress={() =>
              router.push({
                pathname: '/Gather/PostDetails' as any,
                params: {
                  post: JSON.stringify(post),
                },
              })
            }
          >
            {postContent}
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.postContainer,
              { paddingHorizontal: shouldHideContent ? 0 : 20 },
            ]}
          >
            {postContent}
          </View>
        )}
        
          
          
        
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
  group: {
    fontWeight: '600',
    fontSize: 12,
    color: Theme.black,
  },
  time: {
    paddingTop: 2,
    fontSize: 10,
    color: Theme.textPostTime,
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
