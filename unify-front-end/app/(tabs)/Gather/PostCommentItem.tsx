import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Like from '@/assets/images/Like.svg';
import Like_Fill from '@/assets/images/Like_filled.svg';
import { formatSmartTime } from '@/utils/dateUtils';
import { useMutateLikeComment } from '@/hooks/posts/useMutateLikeComment';
import { useMutateDeleteComment } from '@/hooks/posts/useMutateDeleteComment';
import { memo, useCallback, useState } from 'react';
import { PostCommentData } from '@/types/feeds/postcomment';
import { Avatar } from '@/components/Avatar';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Theme } from '@/constants/Theme';
import { useCurrentUser } from '@/context/UserContext';
import { Permissions } from '@/types/permissions';

interface PostCommentItemProps {
  comment: PostCommentData;
  metadata?: {
    isLiked: boolean;
    likeCount: number;
    // TODO: when replies to comments are implemented
    // replyCount: number
  };
  metadataLoading?: boolean;
  postAuthorId?: string; // ID of the user who created the parent post
}

const PostCommentItem = memo(
  ({
    comment,
    metadata,
    metadataLoading,
    postAuthorId,
  }: PostCommentItemProps) => {
    const { currentUser } = useCurrentUser();
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    // Hook for liking and unliking comments
    const likeCommentMutation = useMutateLikeComment();
    const deleteCommentMutation = useMutateDeleteComment();

    const isAdmin = currentUser?.permissions === Permissions.ADMIN;
    const isPartner = currentUser?.permissions === Permissions.PARTNER;
    const ownsPost = postAuthorId && currentUser?.id === postAuthorId;
    const canDelete = isAdmin || (isPartner && ownsPost);

    const toggleLike = useCallback(
      (commentId: number, isLiked: boolean) => {
        likeCommentMutation.mutate({ commentId, isLiked });
      },
      [likeCommentMutation]
    );

    const navigateToUserProfile = useCallback(() => {
      router.push(`/profile?userId=${comment.user_id}`);
    }, [comment.user_id]);

    const handleDeleteComment = useCallback(() => {
      Alert.alert(
        'Delete Comment',
        'Are you sure you want to delete this comment? This action cannot be undone.',
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
              deleteCommentMutation.mutate(
                { commentId: comment.id, postId: comment.post_id },
                {
                  onSuccess: () => {
                    setDeleteModalVisible(false);
                  },
                  onError: error => {
                    Alert.alert(
                      'Error',
                      error.message || 'Failed to delete comment'
                    );
                  },
                }
              );
            },
          },
        ]
      );
    }, [comment.id, comment.post_id, deleteCommentMutation]);

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
              size={40}
            />
          </TouchableOpacity>

          <View style={styles.postContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={navigateToUserProfile}>
                  <Text style={styles.name}>{comment.username}</Text>
                </TouchableOpacity>
                <Text style={styles.time}>
                  {formatSmartTime(comment.created_at)}
                </Text>
              </View>
              {canDelete && (
                <TouchableOpacity
                  onPress={() => setDeleteModalVisible(true)}
                  style={styles.menuButton}
                >
                  <Feather name='more-vertical' size={20} color={Theme.black} />
                </TouchableOpacity>
              )}
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
                  onPress={handleDeleteComment}
                >
                  <Feather
                    name='trash-2'
                    size={20}
                    color='#FF3B30'
                    style={styles.optionIcon}
                  />
                  <Text style={[styles.modalOptionText, styles.deleteText]}>
                    Delete Comment
                  </Text>
                </TouchableOpacity>
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
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  postContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#000',
    textAlign: 'left',
    lineHeight: 16,
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  menuButton: {
    padding: 4,
  },
  headshot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.black,
  },
  time: {
    paddingTop: 2,
    fontSize: 14,
    color: Theme.textPostTime,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 12,
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
    paddingTop: 12,
    paddingBottom: 20,
  },
  dragHandle: {
    width: 77,
    height: 5,
    backgroundColor: Theme.textInactiveTab,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionIcon: {
    marginRight: 8,
  },
  modalOptionText: {
    fontSize: 18,
    color: Theme.black,
    fontWeight: '500',
    flex: 1,
  },
  deleteText: {
    color: '#FF3B30',
  },
});

export default PostCommentItem;
