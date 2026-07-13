import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/context/UserContext';
import { Avatar } from '@/components/Avatar';
import {
  createLessonComment,
  getLessonComments,
  type LessonCommentRow,
} from '@/services/learn/lessonComments';

type LessonCommentsSheetProps = {
  visible: boolean;
  lessonId: string;
  moduleId: string;
  submoduleId: string;
  pageNum: number;
  lessonContext: string;
  onClose: () => void;
};

export default function LessonCommentsSheet({
  visible,
  lessonId,
  moduleId,
  submoduleId,
  pageNum,
  lessonContext,
  onClose,
}: LessonCommentsSheetProps) {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const [draft, setDraft] = useState('');

  const commentsKey = useMemo(
    () => ['lesson-comments', lessonId, pageNum],
    [lessonId, pageNum]
  );

  const { data: comments, isLoading } = useQuery({
    queryKey: commentsKey,
    queryFn: () => getLessonComments({ lessonId, pageNum }),
    enabled: visible && !!lessonId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createLessonComment({
        lessonId,
        moduleId,
        submoduleId,
        pageNum,
        content: draft.trim(),
      }),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: commentsKey });
    },
  });

  const canSend = draft.trim().length > 0 && !createMutation.isPending;

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.contextChip}>
              <Feather name='message-circle' size={12} color='#E0742C' />
              <Text style={styles.contextText} numberOfLines={1}>
                {lessonContext}
              </Text>
            </View>
            <Text style={styles.title}>Comments</Text>
            <Text style={styles.subtitle}>
              One flat comment section for this lesson only.
            </Text>
          </View>

          <FlatList
            data={comments ?? []}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps='handled'
            ListEmptyComponent={() =>
              isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color='#6B46C1' />
                  <Text style={styles.loadingText}>Loading comments...</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Feather name='message-square' size={18} color='#8A827B' />
                  <Text style={styles.emptyTitle}>No comments yet</Text>
                  <Text style={styles.emptyText}>
                    Be the first to leave a note on this lesson.
                  </Text>
                </View>
              )
            }
            renderItem={({ item }) => <CommentRow item={item} />}
          />

          <View style={styles.composer}>
            <View style={styles.composerAvatar}>
              <Avatar
                profilePictureUrl={currentUser?.profilePictureUrl ?? null}
                username={currentUser?.username ?? currentUser?.name ?? 'You'}
                size={34}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder='Add a comment...'
              placeholderTextColor='#8A827B'
              value={draft}
              onChangeText={setDraft}
              multiline
            />
            <Pressable
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              onPress={() => createMutation.mutate()}
              disabled={!canSend}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color='#fff' />
              ) : (
                <Feather name='send' size={16} color='#fff' />
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CommentRow({ item }: { item: LessonCommentRow }) {
  const username = item.users?.username ?? 'Learner';
  return (
    <View style={styles.row}>
      <Avatar
        profilePictureUrl={item.users?.profile_picture_url ?? null}
        username={username}
        size={34}
      />
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowName}>{username}</Text>
          <Text style={styles.rowTime}>
            {new Date(item.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <Text style={styles.rowText}>{item.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 18, 8, 0.42)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fffdfb',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#EAE4DD',
    marginBottom: 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  contextChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F7F2EC',
    borderWidth: 1,
    borderColor: '#EAE4DD',
    marginBottom: 10,
  },
  contextText: {
    fontSize: 11.5,
    color: '#56504B',
    fontWeight: '600',
    maxWidth: '90%',
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: '#1E1B19',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: '#56504B',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAE4DD',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 10,
  },
  rowName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1B19',
    flex: 1,
  },
  rowTime: {
    fontSize: 11.5,
    color: '#8A827B',
  },
  rowText: {
    fontSize: 14.5,
    lineHeight: 20,
    color: '#403A35',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#6B46C1',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B19',
  },
  emptyText: {
    fontSize: 13,
    color: '#56504B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#EAE4DD',
    backgroundColor: '#fff',
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
    borderRadius: 16,
    backgroundColor: '#FFFDFB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14.5,
    color: '#1E1B19',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0E8076',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});