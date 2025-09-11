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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { getModule } from '../../../data/pathways';

/**
 * Sub-Module Presentation
 * 
 * - Reads { pathId, moduleId } so it can render ANY module.
 * - If module.lessons isn't provided, auto-creates 6 generic lessons: "Title 1..6".
 * - Persists progress per (pathId,moduleId) so every module keeps its own state.
 * - First time: CTA says "Start Lesson" → marks current as completed and advances.
 * - Next times: CTA says "Retake Lesson".
 * - Completed lessons show a checkmark in their bubble.
 */


type StoredProgress = { currentIndex: number; completed: number[] };

const storageKey = (pathId: string, moduleId: string) =>
  `progress:${pathId}:${moduleId}`;

const buildFallbackLessons = (count = 6) =>
  Array.from({ length: count }).map((_, i) => ({
    id: `l${i + 1}`,
    title: `Title ${i + 1}`,
  }));

export default function SubModulePresentation() {
  const router = useRouter();
  const { pathId, moduleId } = useLocalSearchParams<{ pathId: string; moduleId: string }>();
  const { pathway, module } = getModule(pathId || '', moduleId || '');

  if (!pathway || !module) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Missing module data.</Text>
      </SafeAreaView>
    );
  }

  // Prefer real lessons; otherwise create 6 placeholders.
  const lessons =
    module.lessons && module.lessons.length > 0
      ? module.lessons
      : buildFallbackLessons(6);

  const [progress, setProgress] = React.useState<StoredProgress>({
    currentIndex: 0,
    completed: [],
  });

  const total = lessons.length;

  // Load saved progress once
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!pathId || !moduleId) return;
        const raw = await AsyncStorage.getItem(storageKey(String(pathId), String(moduleId)));
        if (raw && mounted) {
          const parsed: StoredProgress = JSON.parse(raw);
          setProgress({
            currentIndex: Math.min(Math.max(parsed.currentIndex ?? 0, 0), total - 1),
            completed: Array.isArray(parsed.completed) ? parsed.completed : [],
          });
        }
      } catch {
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pathId, moduleId, total]);

  const persist = React.useCallback(
    async (next: StoredProgress) => {
      setProgress(next);
      if (!pathId || !moduleId) return;
      try {
        await AsyncStorage.setItem(
          storageKey(String(pathId), String(moduleId)),
          JSON.stringify(next)
        );
      } catch {
      }
    },
    [pathId, moduleId]
  );

  const { currentIndex, completed } = progress;
  const currentLesson = lessons[currentIndex];
  const isCurrentCompleted = completed.includes(currentIndex);

  
  const selectLesson = (i: number) => {
    if (i < 0 || i >= total) return;
    if (i === currentIndex) return;
    persist({ currentIndex: i, completed });
  };

  /**
   * CTA behavior:
   * - If first time on this lesson, mark completed & advance to next (unless already last).
   * - If completed already, treat as a "retake" (no state change; hook real lesson nav here).
   */
  const onPressCTA = () => {
    if (!isCurrentCompleted) {
      const nextCompleted = Array.from(new Set([...completed, currentIndex])).sort((a, b) => a - b);
      const nextIndex = Math.min(currentIndex + 1, total - 1);
      persist({ currentIndex: nextIndex, completed: nextCompleted });
    } else {
      // Here we would navigate to the real lesson content.
      // router.push({ pathname: '/(tabs)/Learn/Lessons/lesson-screen', params: { pathId, moduleId, lessonId: currentLesson.id } });
    }
  };

  const statusFor = (i: number): 'completed' | 'current' | 'locked' => {
    if (completed.includes(i)) return 'completed';
    if (i === currentIndex) return 'current';
    return 'locked';
  };

  // Layout positions to mimic your design (alternating sides)
  const bubblePositions = [
    { top: 100, left: 28 },   // 1
    { top: 200, right: 28 },  // 2
    { top: 330, left: 28 },   // 3
    { top: 460, right: 28 },  // 4
    { top: 590, left: 28 },   // 5
    { top: 720, right: 28 },  // 6
  ];

  // Optional: overall module progress % for the copy
  const overallPct = Math.round((completed.length / total) * 100);
  const hasAnyProgress = completed.length > 0;

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
            {`Stage ${currentIndex + 1}: ${currentLesson.title}`}
          </Text>

          <Text style={styles.stageDesc}>
            {hasAnyProgress
              ? `You’re ${overallPct}% through this module. You can retake any lesson at any time.`
              : 'Start this lesson to begin. Lessons you finish will show a checkmark.'}
          </Text>

          <TouchableOpacity style={styles.cta} onPress={onPressCTA} activeOpacity={0.9}>
            <Text style={styles.ctaText}>{isCurrentCompleted ? 'Retake Lesson' : 'Start Lesson'}</Text>
          </TouchableOpacity>
        </View>

        {/* Lesson bubbles */}
        <View style={styles.mapArea}>
          {lessons.map((les, i) => {
            const status = statusFor(i);
            const pos = bubblePositions[i] ?? { top: 100 + i * 130, left: 28 };
            return (
              <Bubble
                key={les.id}
                index={i}
                title={les.title}
                status={status}
                style={pos}
                onPress={() => selectLesson(i)}
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
});
