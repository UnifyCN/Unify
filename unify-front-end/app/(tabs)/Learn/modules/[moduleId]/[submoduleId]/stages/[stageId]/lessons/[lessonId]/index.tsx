import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useLesson } from '@/hooks/learn/useLesson';
import FlashcardsCarousel from '@/components/learn/FlashcardsCarousel';
import DropdownAccordion from '@/components/learn/DropdownAccordion';
import { useStageLessons } from '@/hooks/learn/useStageLessons';

export default function LessonScreen() {
  const router = useRouter();
  const { moduleId, submoduleId, stageId, lessonId } = useLocalSearchParams<{ moduleId: string; submoduleId: string; stageId: string; lessonId: string }>();
  const { data: lesson, isLoading, error } = useLesson(lessonId || '');
  const { data: lessons } = useStageLessons(stageId || '');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}><View style={styles.loading}><Text>Loading lesson...</Text></View></SafeAreaView>
    );
  }
  if (error || !lesson) {
    return (
      <SafeAreaView style={styles.safe}><View style={styles.loading}><Text>Error loading lesson</Text></View></SafeAreaView>
    );
  }

  const ordered = (lessons ?? []).sort((a: any, b: any) => a.order_num - b.order_num);
  const currentIndex = Math.max(0, ordered.findIndex((l: any) => l.id === lesson.id));
  const prev = ordered[currentIndex - 1];
  const next = ordered[currentIndex + 1];

  const goTo = (target: any) => {
    if (!target) return;
    router.replace({
      pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/stages/[stageId]/lessons/[lessonId]' as any,
      params: { moduleId, submoduleId, stageId, lessonId: target.id },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Feather name='chevron-left' size={24} color='#000' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{`Lesson ${lesson.order_num.toFixed(1)}: ${lesson.title}`}</Text>
        </View>

        {/* Dynamic renderer only */}
        {lesson.type === 'flashcards' && (
          <FlashcardsCarousel
            items={lesson.contents.map((c: any, i: number) => ({
              id: `${lesson.id}-${i}`,
              front: c.content?.front ?? c.content?.term ?? 'Card',
              back: c.content?.back ?? c.content?.definition ?? 'Definition',
            }))}
          />
        )}
        {lesson.type === 'dropdown' && (
          <DropdownAccordion
            items={lesson.contents.map((c: any, i: number) => ({
              id: `${lesson.id}-${i}`,
              title: c.content?.title ?? `Item ${i + 1}`,
              body: c.content?.body ?? c.content?.text ?? '',
            }))}
          />
        )}

        <View style={styles.navRow}>
          <TouchableOpacity style={[styles.navBtn, !prev && styles.navBtnDisabled]} disabled={!prev} onPress={() => goTo(prev)}>
            <Text style={styles.navBtnText}>Back</Text>
          </TouchableOpacity>
          {next ? (
            <TouchableOpacity style={styles.navBtn} onPress={() => goTo(next)}>
              <Text style={styles.navBtnText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
              <Text style={styles.navBtnText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 8 },
  iconBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  navBtn: { flex: 1, backgroundColor: '#374151', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  navBtnDisabled: { backgroundColor: '#D1D5DB' },
  navBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
