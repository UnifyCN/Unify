import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSubmoduleLessons } from '@/hooks/learn/useSubmoduleLessons';

/**
 * Sub-Module Presentation
 * 
 * - Reads submoduleId from params to fetch real lesson data from database
 * - Shows actual lesson completion status from user_lesson_progress table
 * - Displays checkmarks for completed lessons
 * - Allows navigation to individual lessons
 */

export default function SubModulePresentation() {
  const router = useRouter();
  const { submoduleId } = useLocalSearchParams<{ submoduleId: string }>();
  
  const { data: submoduleData, isLoading, error } = useSubmoduleLessons(submoduleId || '');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading lessons...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !submoduleData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Error loading lessons: {error?.message || 'Unknown error'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { lessons, total_lessons, completed_lessons, submodule_progress_percent } = submoduleData;
  const currentLesson = lessons.find(lesson => !lesson.is_completed) || lessons[0];
  const currentIndex = lessons.findIndex(lesson => lesson.id === currentLesson?.id) || 0;

  const selectLesson = (lessonId: string) => {
    // Navigate to the specific lesson
    router.push({
      pathname: '/(tabs)/Learn/Finance/Banking/lesson' as any,
      params: { lessonId },
    });
  };

  const onPressCTA = () => {
    if (currentLesson) {
      selectLesson(currentLesson.id);
    }
  };

  const statusFor = (lesson: any): 'completed' | 'current' | 'locked' => {
    if (lesson.is_completed) return 'completed';
    if (lesson.id === currentLesson?.id) return 'current';
    return 'locked';
  };

  const bubblePositions = [
    { top: 100, left: 28 },   // 1
    { top: 200, right: 28 },  // 2
    { top: 330, left: 28 },   // 3
    { top: 460, right: 28 },  // 4
    { top: 590, left: 28 },   // 5
    { top: 720, right: 28 },  // 6
  ];

  // Overall submodule progress
  const overallPct = Math.round(submodule_progress_percent);
  const hasAnyProgress = completed_lessons > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Feather name='chevron-left' size={24} color='#333' />
          </TouchableOpacity>
        </View>

        {/* Top card */}
        <View style={styles.stageCard}>
          <Text style={styles.stageTitle}>
            {currentLesson ? `${currentLesson.title}` : 'No lessons available'}
          </Text>

          <Text style={styles.stageDesc}>
            {hasAnyProgress
              ? `You're ${overallPct}% through this submodule. You can retake any lesson at any time.`
              : 'Start this lesson to begin. Lessons you finish will show a checkmark.'}
          </Text>

          {currentLesson && (
            <TouchableOpacity style={styles.cta} onPress={onPressCTA} activeOpacity={0.9}>
              <Text style={styles.ctaText}>
                {currentLesson.is_completed ? 'Review Lesson' : 'Start Lesson'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lesson bubbles */}
        <View style={styles.mapArea}>
          {lessons.map((lesson, i) => {
            const status = statusFor(lesson);
            const pos = bubblePositions[i] ?? { top: 100 + i * 130, left: 28 };
            return (
              <Bubble
                key={lesson.id}
                index={i}
                title={lesson.title}
                status={status}
                style={pos}
                onPress={() => selectLesson(lesson.id)}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Bubble ----------
function Bubble({
  index,
  title,
  status,
  style,
  onPress,
}: {
  index: number;
  title: string;
  status: 'completed' | 'current' | 'locked';
  style: any;
  onPress: () => void;
}) {
  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';

  return (
    <View style={[styles.bubbleWrapper, style]}>
      <TouchableOpacity
        style={[
          styles.bubble,
          isCompleted && styles.bubbleCompleted,
          isCurrent && styles.bubbleCurrent,
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {isCompleted ? (
          <Feather name='check' size={28} color={'#2e2e2e'} />
        ) : isCurrent ? (
          <Text style={styles.bubbleInnerLabel}>{`Lesson ${index + 1}`}</Text>
        ) : null}
      </TouchableOpacity>

      <Text style={styles.bubbleCaption}>{title}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 6 },

  stageCard: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  stageTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  stageDesc: { marginTop: 8, color: '#555' },

  cta: {
    marginTop: 12,
    backgroundColor: '#efefef',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctaText: { fontWeight: '700', color: '#444' },

  mapArea: {
    marginTop: 18,
    minHeight: 860,
  },
  bubbleWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  bubble: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#EDEDEF',
    borderWidth: 3,
    borderColor: '#D9D9DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleCompleted: {
    backgroundColor: '#E6F6E6',
    borderColor: '#CDEECD',
  },
  bubbleCurrent: {
    borderColor: '#AFAFB1',
    backgroundColor: '#F4F4F5',
  },
  bubbleInnerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  bubbleCaption: {
    marginTop: 8,
    width: 160,
    textAlign: 'center',
    color: '#4C4C4D',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
});
