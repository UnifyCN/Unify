import React, { memo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Pressable,
  Alert,
  useWindowDimensions,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import RenderHtml, { MixedStyleDeclaration } from 'react-native-render-html';
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
import { resolvePostImageUrls } from '@/services/s3/postImageUrlCache';

export interface PostItemProps {
  post: PostData;
  shouldHideContent?: boolean;
  variant?: 'default' | 'homeCard';
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
    variant = 'default',
  }: PostItemProps) => {
    const router = useRouter();
    const { currentUser } = useCurrentUser();
    const { showToast } = useToast();
    const { width } = useWindowDimensions();
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
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
    const canReport = !!currentUser?.id && !ownsPost;
    const isHomeCardVariant = variant === 'homeCard';
    const content = post.content?.trim() ?? '';

    // Card image width = screen width - horizontal card padding (22 * 2) - outer list padding (16 * 2)
    const cardImageWidth = width - 44 - 32;

    // When post_image_urls received, call service to get images
    useEffect(() => {
      if (!post.post_image_urls?.length) return;
      resolvePostImageUrls(post.post_image_urls)
        .then(urls => setImageUrls(urls))
        .catch(err => console.error('resolvePostImageUrls failed:', err));
    }, [post.post_image_urls]);

    // Function to help generate a preview of text for posts on the feed
    const getPreviewFromHtml = (
      html: string,
      lineLimit: number,
      charsPerLine: number
    ): string => {
      // Helper function for splicing HTML tags to get plain text
      const getTextFromHtml = (charCount: number): string => {
        let hIdx = 0;
        let pIdx = 0;
        while (pIdx < charCount && hIdx < html.length) {
          if (html[hIdx] === '<') {
            while (hIdx < html.length && html[hIdx] !== '>') hIdx++;
            hIdx++;
          } else {
            hIdx++;
            pIdx++;
          }
        }
        const openTags: string[] = [];
        const tagPattern = /<(\/?)([biuspa])\b[^>]*>/gi;
        const tempHtml = html.slice(0, hIdx);
        let m;
        while ((m = tagPattern.exec(tempHtml)) !== null) {
          if (m[1] === '/') {
            const last = openTags.lastIndexOf(m[2].toLowerCase());
            if (last !== -1) openTags.splice(last, 1);
          } else {
            openTags.push(m[2].toLowerCase());
          }
        }
        const closingTags = openTags
          .toReversed()
          .map(t => `</${t}>`)
          .join('');
        return html.slice(0, hIdx) + '...' + closingTags;
      };

      const segments = html.split(/<\/p>|<br\s*\/?>/gi); // e.g. "<p>Bold"
      let totalLines = 0; // Running count of occupied lines
      let charsToShow = 0; // Keeps track of which index to splice text from in HTML

      for (const element of segments) {
        const segmentText = element // e.g. "Bold"
          .replaceAll(/<[^>]*>/g, '')
          .replaceAll('&nbsp;', ' ')
          .replaceAll('\r', '');

        if (segmentText.length === 0) continue;

        const segmentLines = Math.ceil(segmentText.length / charsPerLine);

        if (totalLines + segmentLines >= lineLimit) {
          const linesAvailable = lineLimit - totalLines;

          // If out of lines, cut off text
          if (linesAvailable <= 0) {
            return getTextFromHtml(charsToShow);
          }

          const charsAvailable = linesAvailable * charsPerLine;
          const truncatedSegment = segmentText.slice(0, charsAvailable);

          const lastSpace = truncatedSegment.lastIndexOf(' ');
          const cutSegment =
            lastSpace > 0
              ? truncatedSegment.slice(0, lastSpace)
              : truncatedSegment;

          return getTextFromHtml(charsToShow + cutSegment.length);
        }

        totalLines += segmentLines;
        charsToShow += segmentText.length;
      }

      return html;
    };

    // Max characters considered to be a "line break" based on the width of the screen
    // Adjust if necessary to keep it easy on the eyes
    // NOTE: Calculation is an estimate and will not be exact, if text overflows beyond MAX_LINES this may be the cause
    const CHARS_PER_LINE = Math.floor(width / 10);
    const MAX_LINES = 3;

    // Calculate number potentially visible lines based on HTML and enforced CHARS_PER_LINE
    const countVisualLines = (html: string) => {
      const segments = html.split(/<\/p>|<br\s*\/?>/gi);
      let total = 0;
      for (const element of segments) {
        const seg = element
          .replaceAll(/<[^>]*>/g, '')
          .replaceAll('&nbsp;', ' ')
          .replaceAll('\r', '');
        if (seg.length === 0) continue;
        total += Math.ceil(seg.length / CHARS_PER_LINE);
      }
      return Math.max(1, total);
    };

    // Determine if "Read more" text should be displayed
    const shouldShowReadMore = countVisualLines(content) > MAX_LINES;
    const useMaxBodyPreviewHeight = shouldShowReadMore;

    // Get preview text that will be displayed on cards
    const previewHtml = shouldShowReadMore
      ? getPreviewFromHtml(content, MAX_LINES, CHARS_PER_LINE)
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

    const handleCarouselScroll = (
      e: NativeSyntheticEvent<NativeScrollEvent>
    ) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / cardImageWidth);
      setActiveImageIndex(index);
    };

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

    const navigateToComments = () => {
      trackPostCommentOpened(post.id.toString());
      router.push({
        pathname: '/post-details',
        params: {
          post: JSON.stringify(post),
        },
      });
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
            if (!showMetadataLoading) toggleLike(post.id, isLiked);
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
          if (!showMetadataLoading) toggleSave(post.id, isSaved);
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

    const imageCarousel =
      imageUrls.length > 0 ? (
        <View style={styles.carouselWrapper}>
          <View style={styles.carouselContainer}>
            <GHScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={handleCarouselScroll}
              scrollEventThrottle={16}
              decelerationRate='fast'
              snapToInterval={cardImageWidth}
              snapToAlignment='start'
              disableIntervalMomentum
              disallowInterruption
              style={{ width: cardImageWidth }}
              contentContainerStyle={styles.carouselContent}
            >
              {imageUrls.map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={[styles.carouselImage, { width: cardImageWidth }]}
                />
              ))}
            </GHScrollView>
            {imageUrls.length > 1 && (
              <View style={styles.dotsContainer} pointerEvents='none'>
                <View style={styles.dotsIsland}>
                  {imageUrls.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        index === activeImageIndex && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      ) : null;

    const footer = isHomeCardVariant ? (
      <View style={styles.footer}>
        <View style={styles.homeFooterLeft}>
          {likeAction}
          {commentAction}
        </View>
        {saveAction}
      </View>
    ) : (
      <View style={styles.footer}>
        <View style={styles.homeFooterLeft}>
          {likeAction}
          {commentAction}
          {saveAction}
        </View>
      </View>
    );

    // 'react-native-render-HTML' HTML rendering config
    const tagsStyles: Record<string, MixedStyleDeclaration> = {
      body: { fontSize: 16, lineHeight: 22, color: Theme.black },
      a: { color: '#f68b26', textDecorationLine: 'underline' },
      strong: { fontWeight: '700' },
      b: { fontWeight: '700' },
      em: { fontStyle: 'italic' },
      i: { fontStyle: 'italic' },
      u: { textDecorationLine: 'underline' },
      s: { textDecorationLine: 'line-through' },
      del: { textDecorationLine: 'line-through' },
      strike: { textDecorationLine: 'line-through' },
    };

    // Warning text for when links are being opened
    const linkWarningTitle = 'You are about to leave Unify';
    const linkWarningBody =
      'This link is trying to send you to an external page. Never click on links you do not trust. Proceed to';

    // For handling clicks on links
    const renderersProps = {
      a: {
        // Only make link clickable when post opened
        onPress: isHomeCardVariant
          ? undefined
          : (_: any, href: string) => {
              // Open warning alert on click
              Alert.alert(linkWarningTitle, `${linkWarningBody} ${href}?`, [
                { text: 'Go back', style: 'cancel' },
                { text: 'Open link', onPress: () => Linking.openURL(href) },
              ]);
            },
      },
    };

    return (
      <View>
        <View
          style={[
            styles.postContainer,
            shouldHideContent ? styles.noContentPadding : styles.defaultPadding,
            isHomeCardVariant && styles.homeCardContainer,
          ]}
        >
          {/* Home card variant */}
          {isHomeCardVariant ? (
            <View style={styles.homeCardContent}>
              <Pressable
                style={({ pressed }) => [pressed && styles.homeCardPressed]}
                onPress={navigateToComments}
              >
                {/* Header */}
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
                            <Text
                              style={styles.homeMetaGroup}
                              numberOfLines={2}
                            >
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

                  {(canDelete || canReport) && (
                    <TouchableOpacity
                      onPress={() => setDeleteModalVisible(true)}
                      style={styles.menuButton}
                    >
                      <Feather
                        name='more-vertical'
                        size={20}
                        color={Theme.black}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Content */}
                <View style={[styles.postBody, styles.homePostBody]}>
                  {!shouldHideContent && (
                    <View
                      style={[
                        styles.homeDescriptionContainer,
                        !useMaxBodyPreviewHeight &&
                          styles.homeDescriptionContainerCompact,
                      ]}
                    >
                      <RenderHtml
                        contentWidth={width - 92}
                        source={{ html: previewHtml }}
                        tagsStyles={tagsStyles}
                        renderersProps={renderersProps}
                      />
                      {shouldShowReadMore && (
                        <Text style={styles.readMoreText}>Read more</Text>
                      )}
                    </View>
                  )}
                </View>
              </Pressable>

              {/* Image carousel */}
              {imageCarousel}

              {/* Footer */}
              {footer}
            </View>
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
                  {(canDelete || canReport) && (
                    <TouchableOpacity
                      onPress={() => setDeleteModalVisible(true)}
                      style={styles.menuButton}
                    >
                      <Feather
                        name='more-vertical'
                        size={20}
                        color={Theme.black}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={navigateToComments}
                  activeOpacity={0.5}
                  style={styles.postBody}
                >
                  <Text style={styles.title}>{post.title}</Text>

                  {!shouldHideContent && (
                    <View style={styles.contentWrapper}>
                      <RenderHtml
                        contentWidth={width - 92}
                        source={{ html: content }}
                        tagsStyles={tagsStyles}
                        renderersProps={renderersProps}
                      />
                    </View>
                  )}
                </TouchableOpacity>

                {imageCarousel}

                {footer}
              </View>
            </>
          )}
        </View>
        {!isHomeCardVariant && <View style={styles.divider} />}

        {/* Delete / options modal */}
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
                {canDelete && (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={handleDeletePost}
                  >
                    <Feather
                      name='trash-2'
                      size={20}
                      color={Theme.destructive}
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
                {canReport && (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      setDeleteModalVisible(false);
                      router.push({
                        pathname: '/ReportScreen',
                        params: { postId: String(post.id), type: 'post' },
                      });
                    }}
                  >
                    <MaterialCommunityIcons
                      name='flag-outline'
                      size={20}
                      color={Theme.black}
                      style={styles.optionIcon}
                    />
                    <Text style={styles.modalOptionText}>Report Post</Text>
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
  },
  homeHeadshot: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  homeHeaderMetaContainer: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  homeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 20,
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
  contentWrapper: {
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
  readMoreText: {
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
    flex: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 25,
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
    color: Theme.destructive,
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
  carouselWrapper: {
    marginTop: 12,
  },
  carouselContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  carouselContent: {
    flexDirection: 'row',
  },
  carouselImage: {
    height: 200,
    resizeMode: 'cover',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsIsland: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.white,
  },
});
