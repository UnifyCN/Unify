import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

type LessonHelpSheetProps = {
  visible: boolean;
  lessonContext: string;
  lessonTitle: string;
  onClose: () => void;
  onAskAI: () => void;
  onOpenCommunity: () => void;
  communityLoading?: boolean;
};

export default function LessonHelpSheet({
  visible,
  lessonContext,
  lessonTitle,
  onClose,
  onAskAI,
  onOpenCommunity,
  communityLoading = false,
}: LessonHelpSheetProps) {
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
          >
            <View style={styles.header}>
              <View style={styles.contextChip}>
                <Feather name='book-open' size={12} color='#E0742C' />
                <Text style={styles.contextText} numberOfLines={1}>
                  {lessonContext}
                </Text>
              </View>
              <Text style={styles.title}>Get help with this lesson</Text>
              <Text style={styles.subtitle}>
                Stay in context, or jump into the discussion board for this topic.
              </Text>
            </View>

            <View style={styles.cards}>
              <Pressable style={[styles.card, styles.aiCard]} onPress={onAskAI}>
                <View style={[styles.icon, styles.aiIcon]}>
                  <Feather name='star' size={20} color='#fff' />
                </View>
                <View style={styles.cardText}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>AI Companion</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Instant</Text>
                    </View>
                  </View>
                  <Text style={styles.cardSubtitle}>
                    Ask a question about {lessonTitle} and get an answer with lesson context.
                  </Text>
                </View>
                <Feather name='chevron-right' size={20} color='#8A827B' />
              </Pressable>

              <Pressable
                style={[styles.card, styles.communityCard]}
                onPress={onOpenCommunity}
                disabled={communityLoading}
              >
                <View style={[styles.icon, styles.communityIcon]}>
                  {communityLoading ? (
                    <ActivityIndicator color='#fff' />
                  ) : (
                    <Feather name='users' size={20} color='#fff' />
                  )}
                </View>
                <View style={styles.cardText}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>Community Discussion</Text>
                    <View style={[styles.badge, styles.communityBadge]}>
                      <Text style={[styles.badgeText, styles.communityBadgeText]}>
                        Docs
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardSubtitle}>
                    See how other learners asked about the same topic.
                  </Text>
                </View>
                <Feather name='chevron-right' size={20} color='#8A827B' />
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
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
    paddingBottom: 18,
    paddingTop: 8,
    maxHeight: '86%',
  },
  sheetContent: {
    paddingBottom: 8,
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
    paddingBottom: 16,
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
  cards: {
    paddingHorizontal: 18,
    paddingTop: 4,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#EAE4DD',
  },
  aiCard: {
    borderColor: '#DCEFEC',
  },
  communityCard: {
    borderColor: '#ECE6F9',
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiIcon: {
    backgroundColor: '#0E8076',
  },
  communityIcon: {
    backgroundColor: '#6B46C1',
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#1E1B19',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#DCEFEC',
  },
  badgeText: {
    fontSize: 10.5,
    lineHeight: 12,
    fontWeight: '800',
    color: '#0A645C',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  communityBadge: {
    backgroundColor: '#ECE6F9',
  },
  communityBadgeText: {
    color: '#553398',
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#56504B',
  },
});