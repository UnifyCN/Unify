import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Like from '@/assets/images/Like.svg';
import Like_Fill from '@/assets/images/Like_filled.svg';
import Save from '@/assets/images/Save.svg';
import Save_Fill from '@/assets/images/Save_filled.svg';
import Comment from '@/assets/images/Comment.svg';
import { PostData } from '@/types/feeds/post';
import { useMutateLikePost } from '@/hooks/posts/useMutateLikePost';
import { useMutateSavePost } from '@/hooks/posts/useMutateSavePost';
import { useMutateDeletePost } from '@/hooks/posts/useMutateDeletePost';
import { useMutatePinPost } from '@/hooks/posts/useMutatePinPost';
import { formatSmartTime } from '@/utils/dateUtils';
import ChevronRight from '@/components/icons/PostHeaderIcon';
import { Avatar } from '@/components/Avatar';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Theme } from '@/constants/Theme';
import { useCurrentUser } from '@/context/UserContext';
import { Permissions } from '@/types/permissions';
import { useAnalytics } from '@/utils/analytics';

export interface PostItemProps {
  post: PostData;
  shouldHideContent?: boolean;
  metadata?: {
    isLiked: boolean;
    isSaved: boolean;
    likeCount: number;
    commentCount: number;
  };
  metadataLoading?: boolean;
  isAbleToDelete?: boolean;
}
export const PostItem = memo(
  ({
    post,
    metadata,
    shouldHideContent,
    metadataLoading,
    isAbleToDelete = true,
  }: PostItemProps) => {
    const router = useRouter();
    const { currentUser } = useCurrentUser();
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const {
      trackPostLike,
      trackPostUnlike,
      trackPostSave,
      trackPostUnsave,
      trackPostCommentOpened,
    } = useAnalytics();

    // Use batch-loaded metadata (no individual queries needed)
    const likePostMutation = useMutateLikePost();
    const savePostMutation = useMutateSavePost();
    const deletePostMutation = useMutateDeletePost();
    const pinPostMutation = useMutatePinPost();

    const isAdmin = currentUser?.permissions === Permissions.ADMIN;
    const isPartner = currentUser?.permissions === Permissions.PARTNER;
    const ownsPost = currentUser?.id === String(post.user.id);
    const canDelete = isAbleToDelete && (isAdmin || (isPartner && ownsPost));
    const canPin = isAdmin; // Only admins can pin/unpin

    const handlePinPost = () => {
      // ... same implementation
      pinPostMutation.mutate(
        { postId: post.id, isPinned: post.isPinned ?? false },
        {
          onSuccess: () => {
            setDeleteModalVisible(false);
          },
          onError: (error) => {
            Alert.alert(
              'Error',
              error.message || `Failed to ${post.isPinned ? 'unpin' : 'pin'} post`
            );
          },
        }
      );
    };

    const toggleLike = (postId: number, isLiked: boolean) => {
      // ... same implementation
      if (isLiked) {
        trackPostUnlike(postId.toString());
      } else {
        trackPostLike(postId.toString());
      }
      likePostMutation.mutate({ postId, isLiked });
    };

    const toggleSave = (postId: number, isSaved: boolean) => {
      // ... same implementation
      if (isSaved) {
        trackPostUnsave(postId.toString());
      } else {
        trackPostSave(postId.toString());
      }
      savePostMutation.mutate({ postId, isSaved });
    };

    const navigateToUserProfile = () => {
      router.push(`/profile?userId=${post.user.id}`);
    };

    const handleDeletePost = () => {
      Alert.alert(
        'Delete Post',
        'Are you sure you want to delete this post? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setDeleteModalVisible(false),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deletePostMutation.mutate(post.id, {
                onSuccess: () => {
                  setDeleteModalVisible(false);
                },
                onError: error => {
                  Alert.alert(
                    'Error',
                    error.message || 'Failed to delete post'
                  );
                },
              });
            },
          },
        ]
      );
    };

    const navigateToComments = () => {
      trackPostCommentOpened(post.id.toString());
      router.push({
        pathname: '/post-details',
        params: {
          post: JSON.stringify(post),
        },
      });
    };

    // Use batch-loaded metadata with loading state
    const likeCount = metadata?.likeCount ?? 0;
    const isLiked = metadata?.isLiked ?? false;
    const isSaved = metadata?.isSaved ?? false;
    const commentCount = metadata?.commentCount ?? 0;

    // Show loading state for metadata if it's still loading
    const showMetadataLoading = metadataLoading && !metadata;

    return (
      <View>
        <View
          style={[
            styles.postContainer,
            { paddingHorizontal: shouldHideContent ? 0 : 20 },
          ]}
        >
          {/* Head Shot */}
          <TouchableOpacity
            style={styles.headshot}
            onPress={navigateToUserProfile}
          >
            <Avatar
              profilePictureUrl={post.user.profilePictureUrl}
              username={post.user.username}
              size={40}
            />
          </TouchableOpacity>
          {/* Post Content */}
          <View style={styles.postContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={navigateToUserProfile}>
                  <Text style={styles.name}>{post.user.name}</Text>
                </TouchableOpacity>
                {post.group && (
                  <>
                    <Text style={styles.dotSeparator}>•</Text>
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
                  </>
                )}
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.time}>{formatSmartTime(post.time)}</Text>
                {post.isPinned && (
                  <View style={styles.pinnedBadge}>
                    <Text style={styles.pinnedText}>Pinned</Text>
                  </View>
                )}
              </View>
              {canDelete && (
                <TouchableOpacity
                  onPress={() => setDeleteModalVisible(true)}
                  style={styles.menuButton}
                >
                  <Feather name='more-vertical' size={20} color={'#999'} />
                </TouchableOpacity>
              )}
            </View>

            {/* Title and Content - Clickable to navigate to post details */}
            <TouchableOpacity onPress={navigateToComments} activeOpacity={0.5}>
              <View>
                <Text style={styles.title}>{post.title}</Text>
              </View>

              {/* Content */}
              {!shouldHideContent && (
                <Text style={styles.description}>{post.content}</Text>
              )}
            </TouchableOpacity>

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
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
              <TouchableOpacity
                style={styles.footerItem}
                onPress={navigateToComments}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Comment width={20} height={20} fill='gray' />
                {showMetadataLoading ? (
                  <SkeletonLoader width={24} height={20} />
                ) : (
                  <Text style={styles.footerText}>{commentCount}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (isSaved !== undefined && !showMetadataLoading) {
                    toggleSave(post.id, isSaved);
                  }
                }}
                disabled={showMetadataLoading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showMetadataLoading ? (
                  <SkeletonLoader width={20} height={20} borderRadius={4} />
                ) : isSaved ? (
                  <Save_Fill width={20} height={20} />
                ) : (
                  <Save width={20} height={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Delete Modal */}
        <Modal
          animationType='fade'
          transparent={true}
          visible={deleteModalVisible}
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setDeleteModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <Pressable
                style={styles.modalContent}
                onPress={e => e.stopPropagation()}
              >
                <View style={styles.dragHandle} />
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={handleDeletePost}
                >
                  <Feather
                    name='trash-2'
                    size={20}
                    color='#FF3B30'
                    style={styles.optionIcon}
                  />
                  <Text style={[styles.modalOptionText, styles.deleteText]}>
                    Delete Post
                  </Text>
                </TouchableOpacity>
                {canPin && (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={handlePinPost}
                    disabled={pinPostMutation.isPending}
                  >
                    <MaterialCommunityIcons
                      name='pin'
                      size={20}
                      color={Theme.black}
                      style={styles.optionIcon}
                    />
                    <Text style={styles.modalOptionText}>
                      {pinPostMutation.isPending
                        ? (post.isPinned ? 'Unpinning...' : 'Pinning...')
                        : (post.isPinned ? 'Unpin Post' : 'Pin Post')}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={styles.modalOptionText}>Cancel</Text>
                </TouchableOpacity>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  postContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  menuButton: {
    padding: 4,
    marginLeft: 4,
  },
  headshot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  group: {
    fontWeight: '400',
    fontSize: 14,
    color: '#000',
  },
  dotSeparator: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 6,
  },
  time: {
    fontSize: 14,
    color: '#999',
    fontWeight: '400',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
    color: '#000',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 4,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F2F2F2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  optionIcon: {
    marginRight: 16,
  },
  modalOptionText: {
    fontSize: 17,
    color: '#000',
    fontWeight: '400',
    flex: 1,
  },
  deleteText: {
    color: '#FF3B30',
  },
  pinnedBadge: {
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
});
