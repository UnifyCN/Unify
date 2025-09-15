import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStageInfo } from '@/hooks/learn/useStageInfo';
import { useStageLessons } from '@/hooks/learn/useStageLessons';
import FlashcardsCarousel from '@/components/learn/FlashcardsCarousel';
import DropdownAccordion from '@/components/learn/DropdownAccordion';

export default function StageScreen() {
  const router = useRouter();
  const { moduleId, submoduleId, stageId } = useLocalSearchParams<{ moduleId: string; submoduleId: string; stageId: string }>();

  const { data: stage, isLoading: loadingStage, error: stageError } = useStageInfo(stageId || '');
  const { data: lessons, isLoading: loadingLessons } = useStageLessons(stageId || '');

  if (loadingStage) {
    return (
      <SafeAreaView style={styles.safe}><View style={styles.loading}><Text>Loading stage...</Text></View></SafeAreaView>
    );
  }

  if (stageError || !stage) {
    return (
      <SafeAreaView style={styles.safe}><View style={styles.loading}><Text>Error loading stage</Text></View></SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Feather name='chevron-left' size={24} color='#000' />
          </TouchableOpacity>
        </View>

        <Text style={styles.moduleLabel}>{`Stage ${stage.order_num}: ${stage.title}`}</Text>
        <Text style={styles.title}>{`Welcome Back to Your ${stage.submodule.title} Journey in Canada!`}</Text>
        <View style={styles.media} />
        <Text style={styles.desc}>{`Now that you've learned some basics, let's move into ${stage.title}.`}</Text>

        {!loadingLessons && lessons && lessons.length > 0 && (
          <View style={{ gap: 20 }}>
            {lessons.map((lesson: any) => {
              if (lesson.type === 'flashcards') {
                const items = lesson.contents.map((c: any, i: number) => ({
                  id: `${lesson.id}-${i}`,
                  front: c.content?.front ?? c.content?.term ?? 'Card',
                  back: c.content?.back ?? c.content?.definition ?? 'Definition',
                }));
                return (
                  <View key={lesson.id}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <FlashcardsCarousel items={items} />
                  </View>
                );
              }
              if (lesson.type === 'dropdown') {
                const items = lesson.contents.map((c: any, i: number) => ({
                  id: `${lesson.id}-${i}`,
                  title: c.content?.title ?? `Item ${i + 1}`,
                  body: c.content?.body ?? c.content?.text ?? '',
                }));
                return (
                  <View key={lesson.id}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <DropdownAccordion items={items} />
                  </View>
                );
              }
              return (
                <View key={lesson.id}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Text style={{ color: '#6B7280' }}>Unsupported lesson type</Text>
                </View>
              );
            })}
            {/* Next button to go to first lesson */}
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => {
                const first = lessons[0];
                if (!first) return;
                 router.push({
                   pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/stages/[stageId]/lessons/[lessonId]' as any,
                   params: { moduleId, submoduleId, stageId: stage.id, lessonId: first.id },
                 });
              }}
            >
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  iconBtn: { padding: 8, marginLeft: -8 },
  moduleLabel: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 8, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: '#000', marginBottom: 16, lineHeight: 34 },
  media: { height: 160, borderRadius: 12, backgroundColor: '#E5E7EB', marginBottom: 12 },
  desc: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 20 },
  lessonTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 12 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  nextBtn: { marginTop: 8, backgroundColor: '#374151', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});


