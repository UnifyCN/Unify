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
import { useToast } from '@/context/ToastContext';
import { Permissions } from '@/types/permissions';
import { useAnalytics } from '@/utils/analytics';
import { getGroupByName } from '@/services/groups/getGroupByName';
import { usePostReportStatus } from '@/hooks/posts/usePostReportStatus';

export interface PostItemProps {
  post: PostData;
  shouldHideContent?: boolean;
  variant?: 'default' | 'homeCard';
  metadata?: {
    isLiked: boolean;
    isSaved: boolean;
    likeCount: number;
    commentCount: number;
    isReported?: boolean;
    reportCount?: number; //maybe keeping this hidden is a good idea
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
    variant = 'default',
  }: PostItemProps) => {
    const router = useRouter();
    const { currentUser } = useCurrentUser();
    const { showToast } = useToast();
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
    //const reportMutation = useMutateReport();

    const isAdmin = currentUser?.permissions === Permissions.ADMIN;
    const canDelete = isAbleToDelete && isAdmin;
    const canPin = isAdmin; // Only admins can pin/unpin
    const isHomeCardVariant = variant === 'homeCard';
    const content = post.content?.trim() ?? '';
    const shouldShowReadMore = content.length > 170;
    const useMaxBodyPreviewHeight = shouldShowReadMore;
    const previewContent = shouldShowReadMore
      ? `${content.slice(0, 170).trimEnd()}...`
      : content;

    const handlePinPost = () => {
      pinPostMutation.mutate(
        { postId: post.id, isPinned: post.isPinned ?? false },
        {
          onSuccess: () => {
            setDeleteModalVisible(false);
          },
          onError: error => {
            Alert.alert(
              'Error',
              error.message ||
                `Failed to ${post.isPinned ? 'unpin' : 'pin'} post`
            );
          },
        }
      );
    };
    const { data: isReportedPost } = usePostReportStatus(post.id);
    const toggleLike = (postId: number, isLiked: boolean) => {
      if (isLiked) {
        trackPostUnlike(postId.toString());
      } else {
        trackPostLike(postId.toString());
      }
      likePostMutation.mutate({ postId, isLiked });
    };

    const toggleSave = (postId: number, isSaved: boolean) => {
      if (isSaved) {
        trackPostUnsave(postId.toString());
      } else {
        trackPostSave(postId.toString());
      }
      savePostMutation.mutate(
        { postId, isSaved },
        {
          onSuccess: () => {
            if (!isSaved) {
              showToast('Post saved! Find it in Settings > Saved Posts', () => {
                router.push('/saved');
              });
            }
          },
        }
      );
    };

    const navigateToUserProfile = () => {
      router.push(`/profile?userId=${post.user.id}`);
    };

    const navigateToGroupDetail = async () => {
      if (!post.group) return;

      try {
        const group = await getGroupByName(post.group);
        if (group) {
          router.push({
            pathname: '/group-detail' as any,
            params: { group: JSON.stringify(group) },
          });
          return;
        }

        router.push({
          pathname: '/group-detail' as any,
          params: { groupName: post.group },
        });
      } catch (error) {
        console.error('Failed to fetch group:', error);
        router.push({
          pathname: '/group-detail' as any,
          params: { groupName: post.group },
        });
      }
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

    const navigateToReport = () => {
      setDeleteModalVisible(false);
      if (showMetadataLoading) return;
      if (isReportedPost) {
        showToast("You've already reported this post.");
        return;
      }
      router.push({
        pathname: '/ReportScreen',
        params: { postId: String(post.id) },
      });
    };

    // Use batch-loaded metadata with loading state
    const likeCount = metadata?.likeCount ?? 0;
    const isLiked = metadata?.isLiked ?? false;
    const isSaved = metadata?.isSaved ?? false;
    const commentCount = metadata?.commentCount ?? 0;

    // Show loading state for metadata if it's still loading
    const showMetadataLoading = metadataLoading && !metadata;
    const iconSize = isHomeCardVariant ? 24 : 20;

    const likeAction = (
      <View style={styles.footerItem}>
        <TouchableOpacity
          onPress={() => {
            if (!showMetadataLoading) {
              toggleLike(post.id, isLiked);
            }
          }}
          disabled={showMetadataLoading}
          style={isHomeCardVariant ? styles.homeActionTouchable : undefined}
        >
          {isLiked ? (
            <Like_Fill width={iconSize} height={iconSize} />
          ) : (
            <Like width={iconSize} height={iconSize} />
          )}
        </TouchableOpacity>
        {showMetadataLoading ? (
          <SkeletonLoader width={20} height={14} />
        ) : (
          <Text
            style={[
              styles.footerText,
              isHomeCardVariant && styles.homeFooterText,
            ]}
          >
            {likeCount}
          </Text>
        )}
      </View>
    );

    const commentAction = (
      <TouchableOpacity style={styles.footerItem} onPress={navigateToComments}>
        <View
          style={isHomeCardVariant ? styles.homeActionTouchable : undefined}
        >
          <Comment width={iconSize} height={iconSize} fill='gray' />
        </View>
        {showMetadataLoading ? (
          <SkeletonLoader width={24} height={20} />
        ) : (
          <Text
            style={[
              styles.footerText,
              isHomeCardVariant && styles.homeFooterText,
            ]}
          >
            {commentCount}
          </Text>
        )}
      </TouchableOpacity>
    );

    const saveAction = (
      <TouchableOpacity
        onPress={() => {
          if (!showMetadataLoading) {
            toggleSave(post.id, isSaved);
          }
        }}
        disabled={showMetadataLoading}
        style={
          isHomeCardVariant
            ? [styles.homeSaveButton, styles.homeActionTouchable]
            : undefined
        }
      >
        {showMetadataLoading ? (
          <SkeletonLoader width={20} height={20} borderRadius={4} />
        ) : isSaved ? (
          <Save_Fill width={iconSize} height={iconSize} />
        ) : (
          <Save width={iconSize} height={iconSize} />
        )}
      </TouchableOpacity>
    );

    const footer = isHomeCardVariant ? (
      <View style={[styles.footer, styles.homeFooter]}>
        <View style={styles.homeFooterLeft}>
          {likeAction}
          {commentAction}
        </View>
        {saveAction}
      </View>
    ) : (
      <View style={styles.footer}>
        {likeAction}
        {commentAction}
        {saveAction}
      </View>
    );

    return (
      <View>
        <View
          style={[
            styles.postContainer,
            shouldHideContent ? styles.noContentPadding : styles.defaultPadding,
            isHomeCardVariant && styles.homeCardContainer,
          ]}
        >
          {isHomeCardVariant ? (
            <Pressable
              style={({ pressed }) => [
                styles.postContent,
                styles.homeCardContent,
                pressed && styles.homeCardPressed,
              ]}
              onPress={navigateToComments}
            >
              <View style={styles.homeHeaderRow}>
                <TouchableOpacity
                  style={[styles.headshot, styles.homeHeadshot]}
                  onPress={navigateToUserProfile}
                >
                  <Avatar
                    profilePictureUrl={post.user.profilePictureUrl}
                    username={post.user.username}
                    size={52}
                  />
                </TouchableOpacity>

                <View style={styles.homeHeaderMetaContainer}>
                  <View style={styles.homeMetaRow}>
                    <View style={styles.homeMetaLeft}>
                      <TouchableOpacity onPress={navigateToUserProfile}>
                        <Text style={styles.homeName} numberOfLines={1}>
                          {post.user.name}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.homeTime}>
                        {formatSmartTime(post.time)}
                      </Text>
                      {post.group && (
                        <TouchableOpacity
                          onPress={navigateToGroupDetail}
                          style={styles.homeMetaGroupWrap}
                        >
                          <Text style={styles.homeMetaGroup} numberOfLines={2}>
                            {post.group}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Text style={styles.homeTitle} numberOfLines={2}>
                    {post.isPinned ? '📌 ' : ''}
                    {post.title}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setDeleteModalVisible(true)}
                  style={styles.menuButton}
                >
                  <Feather name='more-vertical' size={20} color={Theme.black} />
                </TouchableOpacity>
              </View>

              <View style={[styles.postBody, styles.homePostBody]}>
                {!shouldHideContent && (
                  <View
                    style={[
                      styles.homeDescriptionContainer,
                      !useMaxBodyPreviewHeight &&
                        styles.homeDescriptionContainerCompact,
                    ]}
                  >
                    <Text style={styles.homeDescription} numberOfLines={3}>
                      {previewContent}
                      {shouldShowReadMore && (
                        <Text style={styles.homeReadMore}> Read more</Text>
                      )}
                    </Text>
                  </View>
                )}
              </View>

              {footer}
            </Pressable>
          ) : (
            <>
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
              <View style={styles.postContent}>
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={navigateToUserProfile}>
                      <Text style={styles.name}>{post.user.name}</Text>
                    </TouchableOpacity>
                    {post.group && (
                      <>
                        <ChevronRight
                          color={Theme.textAlternateGray}
                          width={6}
                          height={14}
                        />
                        <TouchableOpacity onPress={navigateToGroupDetail}>
                          <Text style={styles.group}>{post.group}</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    <Text style={styles.time}>
                      {formatSmartTime(post.time)}
                    </Text>
                    {post.isPinned && (
                      <View style={styles.pinnedBadge}>
                        <Text style={styles.pinnedText}>Pinned</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setDeleteModalVisible(true)}
                    style={styles.menuButton}
                  >
                    <Feather name='more-vertical' size={20} color={Theme.black} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={navigateToComments}
                  activeOpacity={0.5}
                  style={styles.postBody}
                >
                  <View>
                    <Text style={styles.title}>{post.title}</Text>
                  </View>

                  {!shouldHideContent && (
                    <Text style={styles.description}>{post.content}</Text>
                  )}
                </TouchableOpacity>
                {footer}
              </View>
            </>
          )}
        </View>
        {!isHomeCardVariant && <View style={styles.divider} />}

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
                  onPress={navigateToReport}
                  disabled={showMetadataLoading || !!isReportedPost}
                >
                  <MaterialCommunityIcons
                    name={isReportedPost ? 'flag' : 'flag-outline'}
                    size={20}
                    color={isReportedPost ? Theme.textPostTime : Theme.black}
                    style={styles.optionIcon}
                  />
                  <Text
                    style={[
                      styles.modalOptionText,
                      isReportedPost && styles.disabledOptionText,
                    ]}
                  >
                    {isReportedPost ? 'Post Reported' : 'Report Post'}
                  </Text>
                </TouchableOpacity>
                {canDelete && (
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
                )}
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
                        ? post.isPinned
                          ? 'Unpinning...'
                          : 'Pinning...'
                        : post.isPinned
                          ? 'Unpin Post'
                          : 'Pin Post'}
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
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  defaultPadding: {
    paddingHorizontal: 20,
  },
  noContentPadding: {
    paddingHorizontal: 0,
  },
  homeCardContainer: {
    flexDirection: 'column',
    gap: 0,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CDCBCB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  postContent: {
    flex: 1,
  },
  homeCardContent: {
    width: '100%',
  },
  homeCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.995 }],
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
    gap: 7,
    flex: 1,
  },
  homeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 0,
  },
  homeHeadshot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginTop: 0,
  },
  homeHeaderMetaContainer: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
    marginTop: 0,
  },
  homeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 20,
    marginTop: 0,
  },
  homeMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    flexWrap: 'wrap',
    paddingRight: 4,
  },
  homeMetaGroupWrap: {
    flexShrink: 1,
  },
  homeMetaGroup: {
    fontSize: 14,
    lineHeight: 18,
    color: Theme.textPostTime,
    fontWeight: '500',
    flexShrink: 1,
  },
  menuButton: {
    padding: 4,
    marginRight: 0,
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
  homeName: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.black,
    lineHeight: 18,
    flexShrink: 1,
  },
  group: {
    fontWeight: '600',
    fontSize: 14,
    color: Theme.black,
  },
  time: {
    paddingTop: 0,
    fontSize: 14,
    color: Theme.textPostTime,
    fontWeight: '500',
  },
  homeTime: {
    fontSize: 14,
    color: Theme.textPostTime,
    fontWeight: '400',
    lineHeight: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  homeTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 26,
    color: Theme.black,
    minHeight: 24,
    marginTop: 6,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 4,
  },
  homeDescriptionContainer: {
    minHeight: 66,
    marginTop: 6,
    justifyContent: 'flex-start',
  },
  homeDescriptionContainerCompact: {
    minHeight: 0,
  },
  homeDescription: {
    fontSize: 16,
    lineHeight: 22,
    color: Theme.black,
  },
  homeReadMore: {
    color: Theme.black,
    fontWeight: '600',
  },
  postBody: {
    marginBottom: 12,
  },
  homePostBody: {
    marginTop: 2,
    marginBottom: 0,
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 25,
  },
  homeFooter: {
    flex: 0,
    justifyContent: 'space-between',
    marginTop: 14,
  },
  homeFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  footerText: {
    fontSize: 14,
  },
  homeFooterText: {
    color: Theme.textAlternateGray,
    fontWeight: '500',
  },
  homeSaveButton: {
    marginLeft: 16,
  },
  homeActionTouchable: {
    minHeight: 32,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingTop: 8,
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
    paddingVertical: 8,
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
  disabledOptionText: {
    color: Theme.textPostTime,
  },
  pinnedBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  pinnedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
});
