import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { useModule } from '@/hooks/learn/useModule';
import { Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** layout constants */
const EDGE_PAD = 16;
const CONTENT_W = SCREEN_WIDTH - EDGE_PAD * 2;
const CARD_RATIO = 0.75; // 75% width cards
const CARD_W = Math.min(420, Math.floor(CONTENT_W * CARD_RATIO));
const RAIL_W = 4;        // unified thickness
const RAIL_OFFSET = 30;  // distance from rail to bubble

export default function ModuleIndex() {
  const router = useRouter();
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const { data: moduleData, isLoading, error } = useModule(moduleId || '');

  // rail start/end calculations
  const [progressBottom, setProgressBottom] = useState(0);
  const [railEnd, setRailEnd] = useState<number | null>(null);

  const onProgressLayout = (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    setProgressBottom(y + height);
  };

  const updateRowBottom = (bottom: number) =>
    setRailEnd(prev => (prev == null ? bottom : Math.max(prev, bottom)));

  /** IMPORTANT: call hooks BEFORE any early returns */
  const railHeight = useMemo(() => {
    if (!railEnd || progressBottom <= 0) return 0;
    const trim = 18; // stop a bit before the last card
    return Math.max(0, railEnd - progressBottom - trim);
  }, [railEnd, progressBottom]);

  // ---------------- early returns (after hooks) ----------------
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}><Text style={styles.muted}>Loading module…</Text></View>
      </SafeAreaView>
    );
  }

  if (error || !moduleData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.error}>Error loading module: {error?.message || 'Unknown error'}</Text>
          <Link href='/(tabs)/Learn'>Go back to Learn</Link>
        </View>
      </SafeAreaView>
    );
  }
  // --------------------------------------------------------------

  // Normalize list + gating (unlock i if i==0 or previous completed)
  const submodules = moduleData.submodules.map((s, i, arr) => {
    const status = s.is_completed ? 'completed' : s.progress_percent > 0 ? 'in-progress' : 'not-started';
    const unlocked = i === 0 || !!arr[i - 1]?.is_completed;
    return { ...s, index: i + 1, status, unlocked };
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header (no "unify" text here) */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name='arrow-left' size={26} color='#111' />
          </TouchableOpacity>
          <View style={{ width: 26 }} />
        </View>

        {/* Title + description */}
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{moduleData.title}</Text>
          {!!moduleData.description && (
            <Text style={styles.subtitle}>{moduleData.description}</Text>
          )}
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard} onLayout={onProgressLayout}>
          <Text style={styles.progressCentered}>
            Progress: {moduleData.completed_submodules}/{moduleData.total_submodules} modules completed
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${moduleData.progress_percent}%` }]} />
          </View>
        </View>

        {/* Rail container */}
        <View style={styles.railContainer}>
          {/* Black rail that starts at the bottom center of the progress card */}
          <View
            pointerEvents="none"
            style={[
              styles.rail,
              {
                top: progressBottom,
                height: railHeight,
                left: SCREEN_WIDTH / 2 - RAIL_W / 2,
              },
            ]}
          />

          {/* Timeline items */}
          <View style={styles.timelineList}>
            {submodules.map((m, i) => {
              const leftSide = i % 2 === 0;
              const ctaText = m.is_completed ? 'Review' : m.progress_percent > 0 ? 'Resume' : 'Start';
              const disabled = !m.unlocked;
              const bubbleText = m.is_completed ? null : `${Math.round(m.progress_percent)}%`;

              return (
                <View
                  key={m.id}
                  style={styles.timelineRow}
                  onLayout={e => updateRowBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
                >
                  {/* per-row upward line segment (same thickness as rail) */}
                  <View
                    pointerEvents="none"
                    style={[
                      styles.rowSegment,
                      { left: SCREEN_WIDTH / 2 - RAIL_W / 2 },
                    ]}
                  />

                  {/* Submodule card */}
                  <TouchableOpacity
                    activeOpacity={disabled ? 1 : 0.9}
                    onPress={() => {
                      if (disabled) return;
                      router.push({
                        pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]' as any,
                        params: { moduleId, submoduleId: m.id },
                      });
                    }}
                    style={[
                      styles.card,
                      leftSide ? styles.cardLeft : styles.cardRight,
                      m.status === 'completed' && styles.cardCompleted,
                    ]}
                  >
                    {/* status pill */}
                    <View
                      style={[
                        styles.pill,
                        m.status === 'completed'
                          ? styles.pillCompleted
                          : m.status === 'in-progress'
                          ? styles.pillInProgress
                          : styles.pillNotStarted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          m.status === 'completed'
                            ? styles.pillTextCompleted
                            : m.status === 'in-progress'
                            ? styles.pillTextInProgress
                            : styles.pillTextNotStarted,
                        ]}
                      >
                        {m.status === 'completed'
                          ? 'Completed'
                          : m.status === 'in-progress'
                          ? 'In Progress'
                          : 'Not Started'}
                      </Text>
                    </View>

                    <Text style={styles.cardTitle}>{m.title}</Text>
                    {!!m.description && <Text style={styles.cardDesc}>{m.description}</Text>}

                    {/* Centered, large CTA (shorter height) */}
                    <View style={styles.ctaRow}>
                      <View style={[styles.cta, (!m.is_completed && disabled) && styles.ctaDisabled]}>
                        <Text style={styles.ctaText}>{ctaText}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Bubble: centered vertically, alternating side */}
                  <View
                    style={[
                      styles.bubbleAbs,
                      leftSide
                        ? { left: SCREEN_WIDTH / 2 + RAIL_OFFSET }
                        : { right: SCREEN_WIDTH / 2 + RAIL_OFFSET - SCREEN_WIDTH },
                    ]}
                  >
                    <View
                      style={[
                        styles.bubbleOuter,
                        (m.unlocked ? styles.bubbleOuterActive : styles.bubbleOuterInactive),
                        m.is_completed && styles.bubbleDoneOuter,
                      ]}
                    >
                      <View
                        style={[
                          styles.bubbleInner,
                          (m.unlocked ? styles.bubbleInnerActive : styles.bubbleInnerInactive),
                          m.is_completed && styles.bubbleDoneInner,
                        ]}
                      >
                        {m.is_completed ? (
                          <Feather name="check" size={18} color="#fff" />
                        ) : (
                          <Text style={styles.bubbleText}>{bubbleText}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===================== styles ===================== */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F9' },
  container: { paddingHorizontal: EDGE_PAD, paddingBottom: 40 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 6,
  },
  backButton: { padding: 8 },

  titleWrap: { alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#151515', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', paddingHorizontal: 12 },

  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    alignItems: 'center',
  },
  progressCentered: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 10, textAlign: 'center' },
  progressBar: { width: '100%', height: 8, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#111', borderRadius: 6 },

  railContainer: { position: 'relative' },
  rail: { position: 'absolute', width: RAIL_W, backgroundColor: '#111', borderRadius: 2 },

  timelineList: { paddingTop: 6 },
  timelineRow: { position: 'relative', marginVertical: 22, minHeight: 120 },

  rowSegment: {
    position: 'absolute',
    top: -28,
    height: 28,
    width: RAIL_W,
    backgroundColor: '#111',
    borderRadius: 2,
  },

  card: {
    width: CARD_W,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  cardLeft: { marginLeft: EDGE_PAD, alignSelf: 'flex-start' },
  cardRight: { marginRight: EDGE_PAD, alignSelf: 'flex-end' },
  cardCompleted: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },

  pill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginBottom: 10 },
  pillCompleted: { backgroundColor: '#DCFCE7' },
  pillInProgress: { backgroundColor: '#E0E7FF' },
  pillNotStarted: { backgroundColor: '#F3F4F6' },
  pillText: { fontSize: 13, fontWeight: '800' },
  pillTextCompleted: { color: '#166534' },
  pillTextInProgress: { color: '#3730A3' },
  pillTextNotStarted: { color: '#6B7280' },

  cardTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 10 },
  cardDesc: { fontSize: 14, color: '#6B7280', marginBottom: 14 },

  ctaRow: { alignItems: 'center' },
  cta: { alignSelf: 'stretch', backgroundColor: '#111', paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  ctaDisabled: { backgroundColor: '#A9B1BC' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  bubbleAbs: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  bubbleOuter: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  bubbleOuterActive: { borderColor: '#AAB2BF' },
  bubbleOuterInactive: { borderColor: '#D1D6DF' },
  bubbleInner: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  bubbleInnerActive: { backgroundColor: '#959DAC' },
  bubbleInnerInactive: { backgroundColor: '#E2E6EE' },
  bubbleDoneOuter: { borderColor: '#059669' },
  bubbleDoneInner: { backgroundColor: '#10B981' },
  bubbleText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  muted: { fontSize: 16, color: '#6B7280' },
  error: { fontSize: 16, color: '#EF4444' },
});
