import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAllHighlights } from '@/hooks/highlights/useHighlights';
import { Highlight } from '@/services/highlights/highlightService';
import { Theme } from '@/constants/Theme';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';

export default function SavedHighlightsList() {
  const { data: highlights, isLoading } = useAllHighlights();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#6B7280" />
      </View>
    );
  }

  if (!highlights || highlights.length === 0) {
    return (
      <EmptyFeedMessage
        icon={<Feather name="bookmark" size={27} color={Theme.textInput} />}
        message="No highlights yet"
        submessage={
          <Text style={styles.emptySubtext}>
            Long-press any text in a lesson to highlight it
          </Text>
        }
      />
    );
  }

  // Group by lesson_id
  const grouped = highlights.reduce<Record<string, Highlight[]>>((acc, h) => {
    if (!acc[h.lesson_id]) acc[h.lesson_id] = [];
    acc[h.lesson_id].push(h);
    return acc;
  }, {});

  const sections = Object.entries(grouped).map(([lessonId, items]) => ({
    lessonId,
    highlights: items,
  }));

  const renderSection = ({
    item,
  }: {
    item: { lessonId: string; highlights: Highlight[] };
  }) => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Feather name="book-open" size={16} color="#6B7280" />
        <Text style={styles.sectionTitle} numberOfLines={1}>
          Lesson
        </Text>
        <Text style={styles.highlightCount}>
          {item.highlights.length} highlight{item.highlights.length !== 1 ? 's' : ''}
        </Text>
      </View>
      {item.highlights.map(h => (
        <View key={h.id} style={styles.highlightItem}>
          <View style={styles.highlightBar} />
          <Text style={styles.highlightText}>"{h.selected_text}"</Text>
        </View>
      ))}
    </View>
  );

  return (
    <FlatList
      data={sections}
      renderItem={renderSection}
      keyExtractor={item => item.lessonId}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptySubtext: {
    fontSize: 14,
    color: Theme.textInput,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.borderCard,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Theme.borderCard,
    backgroundColor: '#FAFAFA',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  highlightCount: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  highlightItem: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  highlightBar: {
    width: 3,
    backgroundColor: Theme.highlightYellow,
    borderRadius: 2,
    marginRight: 12,
  },
  highlightText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    flex: 1,
    fontStyle: 'italic',
  },
});
