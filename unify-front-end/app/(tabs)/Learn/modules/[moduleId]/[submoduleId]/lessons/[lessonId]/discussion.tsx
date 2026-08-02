import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/context/UserContext';
import { Avatar } from '@/components/Avatar';
import { useSanityLesson } from '@/hooks/sanity/useSanityLessons';
import { useSanityModule } from '@/hooks/sanity/useSanityModules';
import { useSanitySubmoduleWithLessons } from '@/hooks/sanity/useSanitySubmodules';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createLessonComment,
  getLessonCommentVoteSummary,
  getLessonComments,
  toggleLessonCommentUpvote,
  type LessonCommentRow,
} from '@/services/learn/lessonComments';
import { buildLessonCommentThreadTree } from '@/services/learn/lessonCommentThreads';
import { formatSmartTime } from '@/utils/dateUtils';

type DiscussionComment = LessonCommentRow & {
  upvoteCount: number;
  isUpvoted: boolean;
};

export default function LessonDiscussionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<DiscussionComment | null>(null);
  const inputRef = useRef<TextInput>(null);

  const { moduleId, submoduleId, lessonId, pageNum } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    lessonId: string;
    pageNum?: string;
  }>();

  const currentPageNum = Number(pageNum || '1');

  const { data: lesson } = useSanityLesson(lessonId || '');
  const { data: moduleData } = useSanityModule(moduleId || '');
  const { data: submoduleData } = useSanitySubmoduleWithLessons(
    submoduleId || ''
  );

  const discussionContext = useMemo(
    () => [moduleData?.title, submoduleData?.title, lesson?.title]
      .filter(Boolean)
      .join(' · '),
    [lesson?.title, moduleData?.title, submoduleData?.title]
  );

  const commentsQuery = useQuery<DiscussionComment[]>({
    queryKey: [
      'lesson-discussion-comments',
      lessonId,
      currentPageNum,
      currentUser?.id ?? null,
    ],
    enabled: !!lessonId,
    queryFn: async () => {
      const comments = await getLessonComments({
        lessonId: lessonId || '',
        pageNum: currentPageNum,
      });

      const voteSummary = await getLessonCommentVoteSummary({
        commentIds: comments.map(comment => comment.id),
        userId: currentUser?.id ?? null,
      });

      const upvotedCommentIds = new Set(voteSummary.upvotedCommentIds);

      return comments.map(comment => ({
        ...comment,
        upvoteCount: voteSummary.counts[comment.id] ?? 0,
        isUpvoted: upvotedCommentIds.has(comment.id),
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createLessonComment({
        lessonId: lessonId || '',
        moduleId: moduleId || '',
        submoduleId: submoduleId || '',
        pageNum: currentPageNum,
        content: draft.trim(),
        parentId: replyingTo?.id ?? null,
      }),
    onSuccess: () => {
      setDraft('');
      setReplyingTo(null);
      queryClient.invalidateQueries({
        queryKey: [
          'lesson-discussion-comments',
          lessonId,
          currentPageNum,
          currentUser?.id ?? null,
        ],
      });
    },
    onError: error => {
      Alert.alert(
        'Could not post comment',
        error instanceof Error ? error.message : 'Please try again.'
      );
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: ({ commentId, upvote }: { commentId: number; upvote: boolean }) =>
      toggleLessonCommentUpvote({ commentId, upvote }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'lesson-discussion-comments',
          lessonId,
          currentPageNum,
          currentUser?.id ?? null,
        ],
      });
    },
  });

  const comments = commentsQuery.data ?? [];
  const threadedComments = useMemo(
    () => buildLessonCommentThreadTree(comments),
    [comments]
  );
  const uniqueCommenters = new Set(comments.map(comment => comment.user_id)).size;
  const discussionTitle = moduleData?.title || lesson?.title || 'Discussion';
  const submoduleTag = submoduleData?.title ?? 'Submodule';
  const safeSubmoduleTag = submoduleTag || 'Submodule';
  const canSubmitComment =
    !!draft.trim() &&
    !createMutation.isPending &&
    !!lessonId &&
    !!moduleId &&
    !!submoduleId &&
    !!currentUser?.id;

  const handleReply = (comment: DiscussionComment) => {
    setReplyingTo(comment);
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}> 
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable style={styles.headerButton} onPress={() => router.back()}>
              <Feather name='chevron-left' size={22} color='#6A635C' />
            </Pressable>

            <View style={styles.headerTitleWrap}>
              <View style={styles.headerIcon}>
                <Feather name='message-circle' size={18} color='#fff' />
              </View>
              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {discussionTitle}
                </Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  Discussion
                </Text>
              </View>
            </View>

            <Pressable style={styles.headerButton} onPress={() => router.back()}>
              <Feather name='x' size={22} color='#6A635C' />
            </Pressable>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {comments.length} comments · {uniqueCommenters || 0} members
            </Text>
          </View>

          <View style={styles.tagRow}>
            <View style={[styles.tagPill, styles.tagPillActive]}>
              <Feather name='hash' size={12} color='#6B46C1' />
              <Text style={[styles.tagText, styles.tagTextActive]}>All</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>{submoduleTag}</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>Submodule</Text>
            </View>
          </View>

          <View style={styles.contextPill}>
            <Feather name='book-open' size={12} color='#E0742C' />
            <Text style={styles.contextPillText} numberOfLines={1}>
              {discussionContext}
            </Text>
          </View>

          <FlatList
            data={threadedComments}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <DiscussionCommentThread
                item={item}
                submoduleTag={safeSubmoduleTag}
                onToggleUpvote={() =>
                  upvoteMutation.mutate({
                    commentId: item.id,
                    upvote: !item.isUpvoted,
                  })
                }
                isPending={upvoteMutation.isPending}
                onReply={handleReply}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              commentsQuery.isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color='#6B46C1' />
                  <Text style={styles.loadingText}>Loading comments...</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Feather name='message-circle' size={20} color='#8A827B' />
                  <Text style={styles.emptyTitle}>No comments yet</Text>
                  <Text style={styles.emptyText}>
                    Be the first to ask something about this lesson.
                  </Text>
                </View>
              )
            }
          />

          <View style={styles.composerWrap}>
            {replyingTo ? (
              <View style={styles.replyingToPill}>
                <Feather name='corner-down-right' size={13} color='#6B46C1' />
                <Text style={styles.replyingToText} numberOfLines={1}>
                  Replying to {replyingTo.users?.username ?? 'Learner'}
                </Text>
                <Pressable onPress={() => setReplyingTo(null)}>
                  <Feather name='x' size={13} color='#6B46C1' />
                </Pressable>
              </View>
            ) : null}
            <View style={styles.composer}>
              <View style={styles.composerAvatar}>
                <Avatar
                  profilePictureUrl={currentUser?.profilePictureUrl ?? undefined}
                  username={currentUser?.username || currentUser?.firstName || 'You'}
                  size={34}
                />
              </View>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={
                  replyingTo
                    ? `Reply to ${replyingTo.users?.username ?? 'them'}...`
                    : `Ask the ${moduleData?.title || 'community'} community...`
                }
                placeholderTextColor='#8A827B'
                value={draft}
                onChangeText={setDraft}
                multiline
                autoFocus={!!replyingTo}
              />
              <Pressable
                style={[
                  styles.sendButton,
                  !canSubmitComment && styles.sendButtonDisabled,
                ]}
                disabled={!canSubmitComment}
                onPress={() => {
                  if (!currentUser?.id) {
                    Alert.alert(
                      'Sign in required',
                      'You need to be signed in to post a comment.'
                    );
                    return;
                  }

                  if (!lessonId || !moduleId || !submoduleId) {
                    Alert.alert(
                      'Missing lesson context',
                      'Please reopen the discussion from the lesson.'
                    );
                    return;
                  }

                  createMutation.mutate();
                }}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color='#fff' />
                ) : (
                  <Feather name='plus' size={20} color='#fff' />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function DiscussionCommentThread({
  item,
  submoduleTag,
  onToggleUpvote,
  isPending,
  onReply,
}: {
  item: DiscussionComment & { replies?: (DiscussionComment & { replies?: unknown[] })[] };
  submoduleTag?: string | null;
  onToggleUpvote: () => void;
  isPending: boolean;
  onReply: (comment: DiscussionComment) => void;
}) {
  return (
    <View>
      <DiscussionCommentCard
        item={item}
        submoduleTag={submoduleTag}
        onToggleUpvote={onToggleUpvote}
        isPending={isPending}
        onReply={onReply}
        depth={0}
      />
      {item.replies && item.replies.length > 0 ? (
        <View style={styles.replyCluster}>
          {item.replies.map(reply => (
            <DiscussionCommentThread
              key={reply.id}
              item={reply as DiscussionComment & { replies?: (DiscussionComment & { replies?: unknown[] })[] }}
              submoduleTag={submoduleTag}
              onToggleUpvote={onToggleUpvote}
              isPending={isPending}
              onReply={onReply}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function DiscussionCommentCard({
  item,
  submoduleTag,
  onToggleUpvote,
  isPending,
  onReply,
  depth = 0,
}: {
  item: DiscussionComment;
  submoduleTag?: string | null;
  onToggleUpvote: () => void;
  isPending: boolean;
  onReply: (comment: DiscussionComment) => void;
  depth?: number;
}) {
  const username = item.users?.username || 'Learner';

  return (
    <View style={[styles.card, depth > 0 && styles.cardReply]}>
      <Pressable
        style={[styles.voteColumn, item.isUpvoted && styles.voteColumnActive]}
        onPress={onToggleUpvote}
        disabled={isPending}
      >
        <Feather
          name='arrow-up'
          size={18}
          color={item.isUpvoted ? '#6B46C1' : '#8A827B'}
        />
        <Text style={[styles.voteCount, item.isUpvoted && styles.voteCountActive]}>
          {item.upvoteCount}
        </Text>
      </Pressable>

      <View style={styles.cardBody}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.userRow}>
            <Avatar
              profilePictureUrl={item.users?.profile_picture_url ?? undefined}
              username={String(username)}
              size={32}
            />
            <View style={styles.userMeta}>
              <Text style={styles.userName} numberOfLines={1}>
                {username}
              </Text>
              <View style={styles.topicBadge}>
                <Text style={styles.topicBadgeText}>{submoduleTag ?? 'Submodule'}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.timeText}>{formatSmartTime(item.created_at)}</Text>
        </View>

        <Text style={styles.commentText}>{item.content}</Text>

        <View style={styles.cardActions}>
          <Pressable style={styles.replyButton} onPress={() => onReply(item)}>
            <Feather name='corner-down-right' size={13} color='#6B46C1' />
            <Text style={styles.replyButtonText}>Reply</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF9F4',
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF9F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE4DD',
    backgroundColor: '#fff',
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE4DD',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: '#1E1B19',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#746B63',
    marginTop: 2,
    fontWeight: '600',
  },
  summaryRow: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  summaryText: {
    fontSize: 13,
    color: '#6A635C',
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F3ECE5',
    borderWidth: 1,
    borderColor: '#E3D8CB',
  },
  tagPillActive: {
    backgroundColor: '#EFE7FB',
    borderColor: '#DCCEF5',
  },
  tagText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    color: '#6A635C',
  },
  tagTextActive: {
    color: '#6B46C1',
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFF4E9',
    borderWidth: 1,
    borderColor: '#F5D6B2',
  },
  contextPillText: {
    flex: 1,
    fontSize: 12,
    color: '#8A5A2B',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 18,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE4DD',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardReply: {
    marginLeft: 14,
    borderColor: '#E5DDF8',
    backgroundColor: '#FFFCFA',
  },
  voteColumn: {
    width: 34,
    borderRadius: 10,
    backgroundColor: '#F6F1FE',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  voteColumnActive: {
    backgroundColor: '#E6DBF9',
  },
  voteCount: {
    fontSize: 11.5,
    color: '#6A635C',
    fontWeight: '800',
  },
  voteCountActive: {
    color: '#6B46C1',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  userRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  userMeta: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  userName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E1B19',
  },
  topicBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#EFE7FB',
  },
  topicBadgeText: {
    fontSize: 10.5,
    color: '#6B46C1',
    fontWeight: '800',
  },
  timeText: {
    fontSize: 11.5,
    color: '#8A827B',
    fontWeight: '600',
  },
  commentText: {
    fontSize: 14.5,
    lineHeight: 20,
    color: '#3E3731',
  },
  cardActions: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F4ECFF',
  },
  replyButtonText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#6B46C1',
  },
  replyCluster: {
    marginLeft: 14,
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#EAE4DD',
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B46C1',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#1E1B19',
    fontWeight: '800',
  },
  emptyText: {
    maxWidth: 280,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    color: '#6A635C',
  },
  composerWrap: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EAE4DD',
  },
  replyingToPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F4ECFF',
    borderWidth: 1,
    borderColor: '#E3D8FB',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  replyingToText: {
    fontSize: 11.5,
    color: '#6B46C1',
    fontWeight: '800',
    flex: 1,
    minWidth: 0,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  composerAvatar: {
    paddingBottom: 3,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#EAE4DD',
    borderRadius: 14,
    backgroundColor: '#FFFDFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E1B19',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B46C1',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});