import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { useSanityModuleWithSubmodules } from '@/hooks/sanity/useSanityModules';
import { useModuleProgress } from '@/hooks/progress/useModuleProgress';
import { useSubmoduleProgress } from '@/hooks/progress/useSubmoduleProgress';
import { getSubmoduleProgress } from '@/services/progress/progressService';
import { cachedProgressService } from '@/services/progress/cachedProgressService';
import { Feather } from '@expo/vector-icons';
// NOTE: THIS FILE IS TO BE DIVIDED TO COMPONENTS AFTER LEARN COMPONENTS CLEAN UP
// --- safety helpers ---
const safeNum = (n: any, fallback = 0) =>
  Number.isFinite(Number(n)) ? Number(n) : fallback;
const clampNonNeg = (n: any) => Math.max(0, safeNum(n, 0));

// screen + layout constants
const { width: RAW_WIDTH } = Dimensions.get('window');
const SCREEN_WIDTH = Math.max(1, safeNum(RAW_WIDTH, 1));

const EDGE_PAD = 16;
const CONTENT_W = Math.max(0, SCREEN_WIDTH - EDGE_PAD * 2);

// Card size
const CARD_RATIO = 0.75;
const CARD_W = 269

const RAIL_W = 4;

// Bubble sizing + gap (distance from card edge to bubble)
const BUBBLE_SIZE = 70; // change to resize circle
const BUBBLE_RADIUS = BUBBLE_SIZE / 2;
const BUBBLE_GAP = 16; // change to move closer/farther from card

export default function ModuleIndex() {
  const router = useRouter();
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const { data: moduleData, isLoading, error } = useSanityModuleWithSubmodules(moduleId || '');
  
  // Progress tracking
  const { moduleProgress, isLoading: progressLoading } = useModuleProgress(moduleId || '');
  const [submoduleProgresses, setSubmoduleProgresses] = useState<{[key: string]: any}>({});
  
  // Calculate module progress from submodule data
  const moduleProgressData = useMemo(() => {
    const submoduleList = Object.values(submoduleProgresses);
    const completedSubmodules = submoduleList.filter((submodule: any) => submodule.is_completed).length;
    const totalSubmodules = moduleData?.submodules?.length || 0;
    const progressPercent = totalSubmodules > 0 ? Math.round((completedSubmodules / totalSubmodules) * 100) : 0;
    
    console.log('Module Progress Calculation:', {
      submoduleProgresses,
      completedSubmodules,
      totalSubmodules,
      progressPercent
    });
    
    return {
      completed_submodules: completedSubmodules,
      total_submodules: totalSubmodules,
      progress_percent: progressPercent
    };
  }, [submoduleProgresses, moduleData?.submodules]);

  // Fetch submodule progress data using cached service
  useEffect(() => {
    if (moduleData?.submodules) {
      const fetchSubmoduleProgress = async () => {
        const progressData: {[key: string]: any} = {};
        
        for (const submodule of moduleData.submodules) {
          try {
            // Use cached progress service for faster access
            const progress = await cachedProgressService.getSubmoduleProgress(moduleId || '', submodule._id);
            console.log(`Cached progress for ${submodule.title}:`, progress);
            progressData[submodule._id] = progress;
          } catch (error) {
            console.error(`Error fetching cached progress for submodule ${submodule._id}:`, error);
            // Set default values if progress fetching fails
            progressData[submodule._id] = {
              is_completed: false,
              progress_percent: 0,
              completed_lessons: 0,
              total_lessons: submodule.lessons?.length || 0
            };
          }
        }
        
        setSubmoduleProgresses(progressData);
      };
      
      fetchSubmoduleProgress();
    }
  }, [moduleData?.submodules, moduleId]);

  // rail start/end calculations
  const [progressBottom, setProgressBottom] = useState(0);
  const [railEnd, setRailEnd] = useState<number | null>(null);

  // visibility tracking
  const rowTopsRef = useRef<number[]>([]);
  const [ahead, setAhead] = useState(0);

  // per-row card layout (for bubble X/Y position)
  const cardLayoutsRef = useRef<
    Array<{ x: number; y: number; width: number; height: number }>
  >([]);

  // Move this BEFORE early returns
  const latestUncompletedIndex = useMemo(() => {
    if (!moduleData?.submodules) return -1;
    // For now, assume all submodules are not completed (we'll implement progress tracking later)
    return moduleData.submodules.findIndex(s => true);
  }, [moduleData?.submodules]);

  const onProgressLayout = (e: LayoutChangeEvent) => {
    const y = clampNonNeg(e.nativeEvent.layout.y);
    const h = clampNonNeg(e.nativeEvent.layout.height);
    setProgressBottom(y + h);
  };

  const updateRowBottom = (bottom: number) =>
    setRailEnd(prev => {
      const b = clampNonNeg(bottom);
      if (!Number.isFinite(b)) return prev ?? 0;
      return prev == null ? b : Math.max(prev, b);
    });

  const railHeight = useMemo(() => {
    if (railEnd == null || progressBottom <= 0) return 0;
    const trim = 18;
    return Math.max(0, railEnd - progressBottom - trim);
  }, [railEnd, progressBottom]);

  if (isLoading || progressLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.muted}>Loading module…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !moduleData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.error}>
            Error loading module: {error?.message || 'Unknown error'}
          </Text>
          <Link href='/(tabs)/Learn'>Go back to Learn</Link>
        </View>
      </SafeAreaView>
    );
  }

  // Normalize list + gating with real progress data
  const submodules = moduleData.submodules.map((s, i, arr) => {
    const progress = submoduleProgresses[s._id];
    const isCompleted = progress?.is_completed || false;
    const progressPercent = progress?.progress_percent || 0;
    
    // Determine status based on progress
    let status = 'not-started';
    if (isCompleted) {
      status = 'completed';
    } else if (progressPercent > 0) {
      status = 'in-progress';
    }
    
    // Unlock logic: first submodule is always unlocked, others unlock when previous is completed
    const unlocked = i === 0 || (i > 0 && submoduleProgresses[moduleData.submodules[i-1]._id]?.is_completed);
    
    return { 
      ...s, 
      id: s._id, // Use Sanity _id
      index: i + 1, 
      status, 
      unlocked,
      is_completed: isCompleted,
      progress_percent: progressPercent
    };
  });

  // compute "ahead" on every scroll
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = clampNonNeg(e.nativeEvent.contentOffset?.y);
    const vh = clampNonNeg(e.nativeEvent.layoutMeasurement?.height);
    const visibleBottom = y + vh;
    const buffer = 4;
    const below = rowTopsRef.current.filter(
      v => Number.isFinite(v) && v > visibleBottom + buffer
    ).length;
    setAhead(below);
  };

  // ========== Bubble helpers ==========
  // Bubble to the LEFT of a card (outside, hugging its left edge)
  const bubbleOutsideLeftOfCard = (index: number, fallbackLeftEdge: number) => {
    const entry = cardLayoutsRef.current[index];
    const cardLeft =
      entry && Number.isFinite(entry.x) ? entry.x : fallbackLeftEdge;
    return Math.max(0, cardLeft - BUBBLE_GAP - 2 * BUBBLE_RADIUS);
  };

  // Bubble to the RIGHT of a card (outside, hugging its right edge)
  const bubbleOutsideRightOfCard = (
    index: number,
    fallbackRightEdge: number
  ) => {
    const entry = cardLayoutsRef.current[index];
    const cardRight =
      entry && Number.isFinite(entry.x) && Number.isFinite(entry.width)
        ? entry.x + entry.width
        : fallbackRightEdge;
    return Math.max(0, cardRight + BUBBLE_GAP);
  };

  // Vertically center the bubble to the CARD
  const bubbleTopForCard = (
    index: number,
    fallbackRowTop: number,
    fallbackRowHeight: number
  ) => {
    const entry = cardLayoutsRef.current[index];
    if (entry && Number.isFinite(entry.y) && Number.isFinite(entry.height)) {
      return Math.max(0, entry.y + (entry.height - BUBBLE_SIZE) / 2);
    }
    // fallback: center in the row until we get card layout
    return Math.max(0, fallbackRowTop + (fallbackRowHeight - BUBBLE_SIZE) / 2);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/Learn')} style={styles.backButton}>
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
            Progress: {moduleProgressData.completed_submodules}/{moduleProgressData.total_submodules} submodules completed
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, Math.max(0, moduleProgressData.progress_percent))}%` },
              ]}
            />
          </View>
        </View>


        {/* Rail container */}
        <View style={styles.railContainer}>
          {/* Rail */}
          {railHeight > 0 && (
            <View
              pointerEvents='none'
              style={[
                styles.rail,
                {
                  top: progressBottom,
                  height: railHeight,
                  left: SCREEN_WIDTH / 2 - RAIL_W / 2,
                },
              ]}
            />
          )}

          {/* Timeline items */}
          <View style={styles.timelineList}>
            {submodules.map((m, i) => {
              const leftSide = i % 2 === 0; // card sits on the left?
              const ctaText = m.is_completed
                ? 'Review'
                : m.progress_percent > 0
                  ? 'Resume'
                  : 'Start';
              const disabled = !m.unlocked;
              const bubbleText = m.is_completed
                ? null
                : `${Math.round(m.progress_percent || 0)}%`;
              

              // Fallback edges until card onLayout fires
              const fallbackLeftEdgeOfRightCard =
                SCREEN_WIDTH - EDGE_PAD - CARD_W; // right-aligned card's LEFT
              const fallbackRightEdgeOfLeftCard = EDGE_PAD + CARD_W; // left-aligned card's RIGHT

              // Row layout (for fallback top)
              let rowTop = 0;
              let rowHeight = 0;

              return (
                <View
                  key={m.id}
                  style={styles.timelineRow}
                  onLayout={e => {
                    rowTop = clampNonNeg(e.nativeEvent.layout.y);
                    rowHeight = clampNonNeg(e.nativeEvent.layout.height);
                    rowTopsRef.current[i] = rowTop;
                    updateRowBottom(rowTop + rowHeight);
                  }}
                >
                  {/* per-row upward line segment */}
                  <View
                    pointerEvents='none'
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
                        pathname:
                          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]' as any,
                        params: { moduleId, submoduleId: m.id },
                      });
                    }}
                    style={[
                      styles.card,
                      leftSide ? styles.cardLeft : styles.cardRight,
                      (m as any).status === 'completed' && styles.cardCompleted,
                    ]}
                    onLayout={ev => {
                      const { x, y, width, height } = ev.nativeEvent.layout;
                      cardLayoutsRef.current[i] = {
                        x: Math.max(0, x),
                        y: Math.max(0, y),
                        width: Math.max(0, width),
                        height: Math.max(0, height),
                      };
                      
                    }}
                  >
                    {/* Small circle indicator for latest uncompleted */}
                    {i === latestUncompletedIndex &&
                      latestUncompletedIndex !== -1 && (
                        <View style={styles.latestIndicator}>
                          <View style={styles.latestIndicatorInner} />
                        </View>
                      )}

                    {/* status chip */}
                    <View
                      style={[
                        styles.pill,
                        (m as any).status === 'completed'
                          ? styles.pillCompleted
                          : (m as any).status === 'in-progress'
                            ? styles.pillInProgress
                            : styles.pillNotStarted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          (m as any).status === 'completed'
                            ? styles.pillTextCompleted
                            : (m as any).status === 'in-progress'
                              ? styles.pillTextInProgress
                              : styles.pillTextNotStarted,
                        ]}
                      >
                        {(m as any).status === 'completed'
                          ? 'Completed'
                          : (m as any).status === 'in-progress'
                            ? 'In Progress'
                            : 'Not Started'}
                      </Text>
                    </View>

                    <Text style={styles.cardTitle}>{m.title}</Text>
                    {!!m.description && (
                      <Text style={styles.cardDesc}>{m.description}</Text>
                    )}

                    {/* CTA */}
                    <View style={styles.ctaRow}>
                      <View
                        style={[
                          styles.cta,
                          !m.is_completed && disabled && styles.ctaDisabled,
                        ]}
                      >
                        <Text style={styles.ctaText}>{ctaText}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Bubble: rail-side of each card, centered to the card */}
                  <View
                    pointerEvents='none'
                    style={[
                      styles.bubbleAbs,
                      {
                        left: leftSide
                          ? bubbleOutsideRightOfCard(
                              i,
                              fallbackRightEdgeOfLeftCard
                            )
                          : bubbleOutsideLeftOfCard(
                              i,
                              fallbackLeftEdgeOfRightCard
                            ),
                        top: bubbleTopForCard(i, rowTop, rowHeight),
                        opacity: 1, // Always show bubble, let positioning handle it
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.bubbleOuter,
                        m.unlocked
                          ? styles.bubbleOuterActive
                          : styles.bubbleOuterBlocked,
                        m.is_completed && styles.bubbleDoneOuter,
                      ]}
                    >
                      <View
                        style={[
                          styles.bubbleInner,
                          m.unlocked
                            ? styles.bubbleInnerActive
                            : styles.bubbleInnerBlocked,
                          m.is_completed && styles.bubbleDoneInner,
                        ]}
                      >
                        {m.is_completed ? (
                          <Feather name='check' size={20} color='#fff' />
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

      {/* floating "N more modules ahead" pill */}
      {ahead > 0 && (
        <View style={styles.morePillWrap} pointerEvents='none'>
          <View style={styles.morePill}>
            <View style={styles.dots}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
            <Text style={styles.moreText}>{ahead} more modules ahead</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F9', position: 'relative' },
  container: { paddingHorizontal: EDGE_PAD, paddingBottom: 40 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 6,
  },
  backButton: { padding: 8 },

  // Header text
  titleWrap: { alignItems: 'center', marginBottom: 8 },
  title: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    color: '#2B2B2B',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 400,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },

  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    alignItems: 'center',
    alignSelf: 'center',
    width: 345,
    height: 69,
    justifyContent: 'center',
  },
  progressCentered: {
    fontSize: 14,
    fontWeight: '600',
    color: '#343434',
    marginBottom: 10,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#111', borderRadius: 6 },

  railContainer: { position: 'relative' },
  rail: {
    position: 'absolute',
    width: RAIL_W,
    backgroundColor: '#111',
    borderRadius: 2,
  },

  timelineList: { paddingTop: 6 },
  timelineRow: { position: 'relative', marginVertical: 18, minHeight: 110 },

  rowSegment: {
    position: 'absolute',
    top: -24,
    height: 24,
    width: RAIL_W,
    backgroundColor: '#111',
    borderRadius: 2,
  },

  // Card
  card: {
    width: CARD_W,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  cardLeft: { marginLeft: EDGE_PAD, alignSelf: 'flex-start' },
  cardRight: { marginRight: EDGE_PAD, alignSelf: 'flex-end' },
  cardCompleted: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },

  // Status chip
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
    borderWidth: 1,
  },
  pillCompleted: { backgroundColor: '#ECFDF5', borderColor: '#C7F9DF' },
  pillInProgress: { backgroundColor: '#F1F5F9', borderColor: '#E5E7EB' },
  pillNotStarted: { backgroundColor: '#F1F5F9', borderColor: '#E5E7EB' },
  pillText: { fontSize: 12, fontWeight: '800' },
  pillTextCompleted: { color: '#166534' },
  pillTextInProgress: { color: '#4B5563' },
  pillTextNotStarted: { color: '#6B7280' },

  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B2B2B',
    lineHeight: 20,
    marginBottom: 7,
  },
  cardDesc: { fontSize: 13, color: '#6B7280', marginBottom: 12 },

  // CTA
  ctaRow: { alignItems: 'center' },
  cta: {
    alignSelf: 'stretch',
    backgroundColor: '#575757',
    paddingVertical: 9,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f0f0f',
    height: 40,
  },
  ctaDisabled: { backgroundColor: '#B7B7B7', borderColor: '#B8BFC9' },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Bubble — absolute box; we set exact top/left inline per card
  bubbleAbs: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
  },
  bubbleOuter: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  bubbleOuterActive: { borderColor: '#BABABA' },
  bubbleOuterBlocked: { borderColor: '#d8d8d8' }, // darker blocked ring
  bubbleInner: {
    width: BUBBLE_SIZE - 10,
    height: BUBBLE_SIZE - 10,
    borderRadius: (BUBBLE_SIZE - 10) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleInnerActive: { backgroundColor: '#A6A6A6' },
  bubbleInnerBlocked: { backgroundColor: '#c8c8c8' }, // darker blocked fill
  bubbleDoneOuter: { borderColor: '#059669' },
  bubbleDoneInner: { backgroundColor: '#10B981' },
  bubbleText: { fontSize: 20, fontWeight: '800', color: '#fff' },

  // floating pill styles
  morePillWrap: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  morePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#D7DDE7',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  dots: { flexDirection: 'row', marginRight: 10 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C7CDD8',
    marginHorizontal: 2,
  },
  moreText: { fontSize: 14, color: '#6B7280', fontWeight: '700' },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  muted: { fontSize: 16, color: '#6B7280' },
  error: { fontSize: 16, color: '#EF4444' },

  latestIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 10,
    backgroundColor: '#707070', // outer grey circle
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  latestIndicatorInner: {
    width: 9,
    height: 9,
    borderRadius: 15,
    backgroundColor: '#FFFFFF', // inner white circle
  },
});
