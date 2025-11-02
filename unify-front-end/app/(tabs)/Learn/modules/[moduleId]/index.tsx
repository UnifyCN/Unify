import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
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
import {
  useRouter,
  useLocalSearchParams,
  Link,
  useFocusEffect,
} from 'expo-router';
import { useSanityModuleWithSubmodules } from '@/hooks/sanity/useSanityModules';
import { useModuleProgress } from '@/hooks/progress/useModuleProgress';
import { cachedProgressService } from '@/services/progress/cachedProgressService';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

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
const CARD_W = 269;

// RAIL
const RAIL_W = 4;
const FIRST_GAP = 20;

// Bubble sizing + gap
const BUBBLE_SIZE = 65;
const BUBBLE_RADIUS = BUBBLE_SIZE / 2;
const BUBBLE_GAP = 16;
// Rings
const RING_MIDDLE = BUBBLE_SIZE - 6;
const RING_INNER = BUBBLE_SIZE - 16;
const PROGRESS_STROKE = 6;

export default function ModuleIndex() {
  const router = useRouter();
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const {
    data: moduleData,
    isLoading,
    error,
  } = useSanityModuleWithSubmodules(moduleId || '');

  // Progress tracking
  const { moduleProgress, isLoading: progressLoading } = useModuleProgress(
    moduleId || ''
  );
  const [submoduleProgresses, setSubmoduleProgresses] = useState<{
    [key: string]: any;
  }>({});

  // Calculate module progress from submodule data
  const moduleProgressData = useMemo(() => {
    const submoduleList = Object.values(submoduleProgresses);
    const completedSubmodules = submoduleList.filter(
      (submodule: any) => submodule.is_completed
    ).length;
    const totalSubmodules = moduleData?.submodules?.length || 0;
    const progressPercent =
      totalSubmodules > 0
        ? Math.round((completedSubmodules / totalSubmodules) * 100)
        : 0;

    return {
      completed_submodules: completedSubmodules,
      total_submodules: totalSubmodules,
      progress_percent: progressPercent,
    };
  }, [submoduleProgresses, moduleData?.submodules]);

  // Fetch submodule progress (initial)
  useEffect(() => {
    if (!moduleData?.submodules) return;
    (async () => {
      const progressData: { [key: string]: any } = {};
      for (const submodule of moduleData.submodules) {
        try {
          const progress = await cachedProgressService.getSubmoduleProgress(
            moduleId || '',
            submodule._id
          );
          progressData[submodule._id] = progress;
        } catch {
          progressData[submodule._id] = {
            is_completed: false,
            progress_percent: 0,
            completed_lessons: 0,
            total_lessons: submodule.lessons?.length || 0,
          };
        }
      }
      setSubmoduleProgresses(progressData);
    })();
  }, [moduleData?.submodules, moduleId]);

  // Refetch progress when screen focuses
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const run = async () => {
        if (!moduleData?.submodules) return;
        const progressData: { [key: string]: any } = {};
        for (const submodule of moduleData.submodules) {
          try {
            progressData[submodule._id] =
              await cachedProgressService.getSubmoduleProgress(
                moduleId || '',
                submodule._id
              );
          } catch {
            progressData[submodule._id] = {
              is_completed: false,
              progress_percent: 0,
              completed_lessons: 0,
              total_lessons: submodule.lessons?.length || 0,
            };
          }
        }
        if (!cancelled) setSubmoduleProgresses(progressData);
      };
      run();
      return () => {
        cancelled = true;
      };
    }, [moduleId, moduleData?.submodules])
  );

  // rail start/end calculations
  const [progressBottom, setProgressBottom] = useState(0);
  const [railEnd, setRailEnd] = useState<number | null>(null);

  // visibility tracking
  const rowTopsRef = useRef<number[]>([]);
  const [ahead, setAhead] = useState(0);

  const railTopRef = useRef(0);
  const timelineTopRef = useRef(0);

  // remember latest scroll snapshot so we can recompute when layouts arrive
const scrollRef = useRef<{ y: number; vh: number }>({ y: 0, vh: 0 });

// compute visible-ahead ignoring unmeasured rows (NaN)
const computeAhead = (y: number, vh: number) => {
  const total = moduleData?.submodules?.length || 0;
  if (total === 0) return setAhead(0);
  const threshold = y + vh + 4;
  const tops = rowTopsRef.current;

  let firstBelowIdx = -1;
  for (let i = 0; i < total; i++) {
    const top = tops[i];
    if (!Number.isFinite(top)) continue; // ignore unmeasured rows
    if (top > threshold) {
      firstBelowIdx = i;
      break;
    }
  }
  const newAhead = firstBelowIdx === -1 ? 0 : total - firstBelowIdx;
  setAhead(newAhead);
};



  // Make rowTopsRef always have one slot per submodule
  useEffect(() => {
    const total = moduleData?.submodules?.length || 0;
    rowTopsRef.current = new Array(total).fill(NaN); // NaN = unmeasured
  }, [moduleData?.submodules?.length]);

  // per-row card layout (for bubble X/Y position)
  const cardLayoutsRef = useRef<
    Array<{ x: number; y: number; width: number; height: number }>
  >([]);

  // ========== Bubble helpers ==========
  const bubbleOutsideLeftOfCard = (index: number, fallbackLeftEdge: number) => {
    const entry = cardLayoutsRef.current[index];
    const cardLeft =
      entry && Number.isFinite(entry.x) ? entry.x : fallbackLeftEdge;
    return Math.max(0, cardLeft - BUBBLE_GAP - 2 * BUBBLE_RADIUS);
  };

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

  // which submodule is the next one the user should do?
  const currentIndex = useMemo(() => {
    if (!moduleData?.submodules) return -1;
    for (let i = 0; i < moduleData.submodules.length; i++) {
      const id = moduleData.submodules[i]._id;
      const p = submoduleProgresses[id];
      if (!p?.is_completed) return i; // first not-completed
    }
    return -1; // all done
  }, [moduleData?.submodules, submoduleProgresses]);

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
    const trim = -240;
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
  const submodules = moduleData.submodules.map((s, i) => {
    const progress = submoduleProgresses[s._id];
    const isCompleted = progress?.is_completed || false;
    const progressPercent = progress?.progress_percent || 0;

    let status: 'not-started' | 'in-progress' | 'completed' = 'not-started';
    if (isCompleted) status = 'completed';
    else if (progressPercent > 0) status = 'in-progress';

    const unlocked =
      i === 0 ||
      (i > 0 &&
        submoduleProgresses[moduleData.submodules[i - 1]._id]?.is_completed);

    return {
      ...s,
      id: s._id,
      index: i + 1,
      status,
      unlocked,
      is_completed: isCompleted,
      progress_percent: progressPercent,
    };
  });

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = clampNonNeg(e.nativeEvent.contentOffset?.y);
    const vh = clampNonNeg(e.nativeEvent.layoutMeasurement?.height);
    scrollRef.current = { y, vh };
    computeAhead(y, vh);
  };


  // === UI ===
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        // optional: run a first pass once the ScrollView knows its height
        onLayout={e => {
          const fakeEvt = {
            nativeEvent: {
              contentOffset: { y: 0 },
              layoutMeasurement: { height: e.nativeEvent.layout.height },
            },
          } as unknown as NativeSyntheticEvent<NativeScrollEvent>;
          handleScroll(fakeEvt);
        }}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/Learn')}
            style={styles.backButton}
          >
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
            Progress: {moduleProgressData.completed_submodules}/
            {moduleProgressData.total_submodules} sections completed
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, Math.max(0, moduleProgressData.progress_percent))}%`,
                  backgroundColor: moduleData?.colorTheme?.hex || '#000',
                },
              ]}
            />
          </View>
        </View>

        {/* Rail container */}
        <View
          style={styles.railContainer}
          // ⬇️ NEW: capture absolute Y for this container (relative to ScrollView content)
          onLayout={e => {
            railTopRef.current = clampNonNeg(e.nativeEvent.layout.y);
          }}
        >
          {/* Rail */}
          {railHeight > 0 && (
            <View
              pointerEvents='none'
              style={[
                styles.rail,
                {
                  top: progressBottom - 245,
                  height: railHeight,
                  left: SCREEN_WIDTH / 2 - RAIL_W / 2,
                },
              ]}
            />
          )}

          {/* Timeline items */}
          <View
            style={styles.timelineList}
            onLayout={e => {
              timelineTopRef.current = clampNonNeg(e.nativeEvent.layout.y);
            }}
          >
            {submodules.map((m, i) => {
              const leftSide = i % 2 === 0; // card sits on the left?
              const ctaText = m.is_completed
                ? 'Review'
                : m.progress_percent > 0
                  ? 'Resume'
                  : 'Start';
              const disabled = !m.unlocked;

              // Fallback edges until card onLayout fires
              const fallbackLeftEdgeOfRightCard =
                SCREEN_WIDTH - EDGE_PAD - CARD_W;
              const fallbackRightEdgeOfLeftCard = EDGE_PAD + CARD_W;

              // Row layout (for fallback top)
              let rowTop = 0;
              let rowHeight = 0;

              // determine current and bubble style per-row
              const isCurrent =
                i === currentIndex && !m.is_completed && m.unlocked;
              const showProgressBubble =
                (m.progress_percent || 0) > 0 || isCurrent;
              const isLocked = !m.unlocked;

              return (
                <View
                  key={m.id}
                  style={styles.timelineRow}
                  onLayout={e => {
                    rowTop = clampNonNeg(e.nativeEvent.layout.y);
                    rowHeight = clampNonNeg(e.nativeEvent.layout.height);

                    const absTop =
                      clampNonNeg(railTopRef.current) +
                      clampNonNeg(timelineTopRef.current) +
                      rowTop;
                    rowTopsRef.current[i] = absTop;
                    updateRowBottom(absTop + rowHeight);
                    computeAhead(scrollRef.current.y, scrollRef.current.vh)
                  }}
                >
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
                    {/* Small circle indicator for current */}
                    {isCurrent && <View style={styles.latestIndicator} />}

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
                          {
                            backgroundColor:
                              moduleData?.colorTheme?.hex || '#575757',
                          },
                          !m.is_completed && disabled
                            ? styles.ctaDisabled
                            : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.ctaText,
                            !m.is_completed && disabled
                              ? styles.ctaTextDisabled
                              : null,
                          ]}
                        >
                          {ctaText}
                        </Text>
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
                        opacity: 1,
                      },
                    ]}
                  >
                    {isLocked ? (
                      // 3-ring LOCKED bubble (no arc)
                      <View style={styles.progressBubble}>
                        <View style={styles.ringOuterLocked} />
                        <View style={styles.ringMiddleLocked} />
                        <View style={styles.ringInnerLocked} />
                        <Text style={styles.bubbleText}>
                          {Math.round(m.progress_percent || 0)}%
                        </Text>
                      </View>
                    ) : showProgressBubble ? (
                      // 3-ring progress bubble (also for current at 0%)
                      <View style={styles.progressBubble}>
                        <View style={styles.ringOuter} />
                        <View style={styles.ringMiddle} />
                        <View style={styles.ringInner} />
                        <Svg
                          height='100%'
                          width='100%'
                          viewBox='0 0 100 100'
                          style={styles.progressSvgTop}
                        >
                          <Circle
                            cx='50'
                            cy='50'
                            r={50 - PROGRESS_STROKE}
                            stroke={moduleData?.colorTheme?.hex || '#000'}
                            strokeWidth={PROGRESS_STROKE}
                            strokeLinecap='round'
                            strokeDasharray={
                              2 * Math.PI * (50 - PROGRESS_STROKE)
                            }
                            strokeDashoffset={
                              2 *
                              Math.PI *
                              (50 - PROGRESS_STROKE) *
                              (1 - (m.progress_percent || 0) / 100)
                            }
                            fill='none'
                          />
                        </Svg>
                        <Text style={styles.bubbleText}>
                          {Math.round(m.progress_percent || 0)}%
                        </Text>
                      </View>
                    ) : (
                      // Original bubble for completed (check)
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
                          <Feather name='check' size={20} color='#fff' />
                        </View>
                      </View>
                    )}
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
        <View style={styles.morePillWrap} pointerEvents="none">
          <View style={styles.morePill}>
            <View style={styles.morePillContent}>
              <View style={styles.dots}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
              <Text style={styles.moreText}>{ahead} more modules ahead</Text>
            </View>
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

  titleWrap: {
    alignItems: 'center',
    marginBottom: 8,
    width: 345,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: '#2B2B2B',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0.25,
    marginBottom: 10,
    width: 345,
  },

  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    alignItems: 'center',
    alignSelf: 'center',
    width: 345,
    height: 69,
    justifyContent: 'center',
    zIndex: 2,
  },
  progressCentered: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#343434',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    width: 323,
    height: 11,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  progressFill: { height: '100%', backgroundColor: '#000', borderRadius: 20 },

  railContainer: { position: 'relative' },
  rail: {
    position: 'absolute',
    width: RAIL_W,
    backgroundColor: '#676767',
    borderRadius: 2,
    zIndex: 0,
    elevation: 0,
  },

  timelineList: { paddingTop: FIRST_GAP },
  timelineRow: { position: 'relative', marginVertical: 18, minHeight: 110 },

  // Card
  card: {
    width: CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#D1D1D1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'visible',
  },
  cardLeft: { marginLeft: EDGE_PAD, alignSelf: 'flex-start' },
  cardRight: { marginRight: EDGE_PAD, alignSelf: 'flex-end' },
  cardCompleted: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },

  // Status chip
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 15,
    marginBottom: 12,
  },
  pillCompleted: { backgroundColor: '#ECFDF5' },
  pillInProgress: { backgroundColor: '#DCDCDC' },
  pillNotStarted: { backgroundColor: '#DCDCDC' },
  pillText: { fontSize: 10, lineHeight: 12, fontWeight: '500' },
  pillTextCompleted: { color: '#166534' },
  pillTextInProgress: { color: '#575757' },
  pillTextNotStarted: { color: '#575757' },

  cardTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.25,
    color: '#2B2B2B',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 16,
    width: '100%',
    fontWeight: '400',
    letterSpacing: 0,
    color: '#2B2B2B',
    marginBottom: 8,
  },

  // CTA
  ctaRow: { alignItems: 'center' },
  cta: {
    width: 230,
    height: 24,
    backgroundColor: '#575757',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 6,
    marginHorizontal: 14,
    paddingVertical: 0,
    borderWidth: 0,
  },
  ctaDisabled: { backgroundColor: '#B7B7B7' },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
  },
  ctaTextDisabled: { color: '#575757' },

  // Bubble — absolute box
  bubbleAbs: { position: 'absolute', width: BUBBLE_SIZE, height: BUBBLE_SIZE },
  bubbleOuter: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  bubbleOuterActive: { borderColor: '#BABABA' },
  bubbleOuterBlocked: { borderColor: '#d8d8d8' },
  bubbleInner: {
    width: BUBBLE_SIZE - 10,
    height: BUBBLE_SIZE - 10,
    borderRadius: (BUBBLE_SIZE - 10) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleInnerActive: { backgroundColor: '#A6A6A6' },
  bubbleInnerBlocked: { backgroundColor: '#c8c8c8' },
  bubbleDoneOuter: { borderColor: '#059669' },
  bubbleDoneInner: { backgroundColor: '#10B981' },

  bubbleText: { fontSize: 16, fontWeight: '500', color: '#fff' },

  progressSvgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    transform: [{ rotateZ: '-90deg' }],
  },

  progressBubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  /* In-progress/current rings */
  ringOuter: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_RADIUS,
    backgroundColor: '#9D9D9D',
  },
  ringMiddle: {
    position: 'absolute',
    width: RING_MIDDLE,
    height: RING_MIDDLE,
    borderRadius: RING_MIDDLE / 2,
    backgroundColor: '#fff',
  },
  ringInner: {
    position: 'absolute',
    width: RING_INNER,
    height: RING_INNER,
    borderRadius: RING_INNER / 2,
    backgroundColor: '#A6A6A6',
    borderWidth: 2.5,
    borderColor: '#9D9D9D',
  },

  /* LOCKED rings */
  ringOuterLocked: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_RADIUS,
    backgroundColor: '#D8D8D8',
  },
  ringMiddleLocked: {
    position: 'absolute',
    width: RING_MIDDLE,
    height: RING_MIDDLE,
    borderRadius: RING_MIDDLE / 2,
    backgroundColor: '#EDEDED',
  },
  ringInnerLocked: {
    position: 'absolute',
    width: RING_INNER,
    height: RING_INNER,
    borderRadius: RING_INNER / 2,
    backgroundColor: '#C8C8C8',
    borderWidth: 2.5,
    borderColor: '#D8D8D8',
  },

  // More modules pill
  morePillWrap: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  morePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 195,          // Ancho
    height: 39,          // Altura
    backgroundColor: '#FFFFFF', // White
    borderColor: '#D1D1D1',     // 1px border color
    borderWidth: 1,
    borderRadius: 20,    // Radio
    paddingHorizontal: 12,
  },
  dots: { flexDirection: 'row', marginRight: 10, marginLeft: 12 },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D7D7D7',
    marginHorizontal: 2,
  },

  moreText: {
    fontSize: 10,
    fontWeight: '600', // Inter 600
    color: '#707070',
    marginRight: 12, // text → right edge of globe
    marginLeft: 0,  // left spacing from dots block
  },

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
    top: -10,
    right: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E4E4E4',
    borderWidth: 7,
    borderColor: '#707070',
  },

    morePillBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1D1D1',
  },
  morePillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 12,
    width: 195,
    height: 39,
  },
  globe: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E9E9E9',
    marginLeft: 'auto',
    // nudge to visually get ~11px top / 16px bottom from text to globe
    marginTop: 11 - (39 - 22) / 2,
    marginBottom: 16 - (39 - 22) / 2,
  },


});
