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
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useRouter,
  useLocalSearchParams,
  Link,
  useFocusEffect,
} from 'expo-router';
import { useSanityModuleWithSubmodules } from '@/hooks/sanity/useSanityModules';
import { useModuleProgress } from '@/hooks/progress/useModuleProgress';
import { cachedProgressService } from '@/services/progress/cachedProgressService';
import { getLessonProgress } from '@/services/progress/progressService';
import { progressClient } from '@/services/progress/progressClient';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
const CARD_W = 274;

// RAIL
const RAIL_W = 4;
const FIRST_GAP = 20;

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
  const [submoduleHrefs, setSubmoduleHrefs] = useState<{
    [key: string]: string;
  }>({});

  // Disclaimer modal state
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Check if disclaimer should be shown (first time opening this module with 0% progress)
  useEffect(() => {
    const checkDisclaimer = async () => {
      if (!moduleId || !moduleData?.title) return;

      // Only show if user hasn't started this module yet
      const overallPercent = moduleProgress?.progress_percent ?? 0;
      if (overallPercent > 0) {
        // Already started → never show disclaimer again for this module
        return;
      }

      try {
        // Per-module key: works for all modules now and for future ones
        const storageKey = `disclaimerSeen_${moduleId}`;
        const hasSeen = await AsyncStorage.getItem(storageKey);

        if (!hasSeen) {
          setShowDisclaimer(true);
        }
      } catch (error) {
        console.error('[Disclaimer] Error checking disclaimer status:', error);
      }
    };

    // Wait for all data to be ready
    if (moduleData && !isLoading && !error && !progressLoading) {
      checkDisclaimer();
    }
  }, [moduleId, moduleData, isLoading, error, progressLoading, moduleProgress]);

  // Handle disclaimer Continue button
  const handleDisclaimerContinue = async () => {
    if (!moduleId) return;
    try {
      const storageKey = `disclaimerSeen_${moduleId}`;
      await AsyncStorage.setItem(storageKey, 'true');
      setShowDisclaimer(false);
    } catch (error) {
      console.error('Error saving disclaimer status:', error);
    }
  };

  // Handle disclaimer Back button
  const handleDisclaimerBack = () => {
    setShowDisclaimer(false);
    router.replace('/(tabs)/Learn');
  };

  // Calculate module progress from submodule data (for UI card)
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

  // Fetch submodule progress and determine resume destinations
  useEffect(() => {
    if (!moduleData?.submodules) return;
    (async () => {
      const progressData: { [key: string]: any } = {};
      const hrefData: { [key: string]: string } = {};

      try {
        const {
          data: { user },
        } = await progressClient.auth.getUser();
        if (!user) {
          // No user, just set progress data
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
          return;
        }

        // Process all submodules in parallel for better performance
        await Promise.all(
          moduleData.submodules.map(async submodule => {
            try {
              const progress = await cachedProgressService.getSubmoduleProgress(
                moduleId || '',
                submodule._id
              );
              progressData[submodule._id] = progress;

              // Skip href calculation if no progress
              if (
                !progress?.progress_percent ||
                progress.progress_percent === 0
              ) {
                // Still set a default href for submodules with no progress
                const hasIntro =
                  submodule.intro_pages && submodule.intro_pages.length > 0;
                if (hasIntro) {
                  hrefData[submodule._id] =
                    `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/intro/1`;
                } else if (submodule.lessons && submodule.lessons.length > 0) {
                  hrefData[submodule._id] =
                    `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/lessons/${submodule.lessons[0]._id}/pages/1`;
                } else {
                  hrefData[submodule._id] =
                    `/(tabs)/Learn/modules/${moduleId}/${submodule._id}`;
                }
                return;
              }

              // Fetch all lesson progress for this submodule
              const { data: lessonProgresses } = await progressClient
                .from('user_lesson_progress')
                .select('*')
                .eq('sanity_submodule_id', submodule._id);

              // Build lesson progress map from database results (faster than individual calls)
              const lessonProgressData: { [key: string]: any } = {};
              if (submodule.lessons && lessonProgresses) {
                for (const lessonProgress of lessonProgresses) {
                  if (lessonProgress.sanity_lesson_id) {
                    lessonProgressData[lessonProgress.sanity_lesson_id] = {
                      is_completed: lessonProgress.is_completed || false,
                      is_in_progress: lessonProgress.is_in_progress || false,
                    };
                  }
                }

                // For lessons without progress records, mark them as not started
                for (const lesson of submodule.lessons) {
                  if (!lessonProgressData[lesson._id]) {
                    lessonProgressData[lesson._id] = {
                      is_completed: false,
                      is_in_progress: false,
                    };
                  }
                }
              }

              // Find active lesson (same logic as useInProgressLessons)
              let activeLesson = null;
              let activeLessonProgress = null;

              if (submodule.lessons) {
                for (let i = 0; i < submodule.lessons.length; i++) {
                  const lesson = submodule.lessons[i];
                  const lessonProgress = lessonProgressData[lesson._id];
                  const isCompleted = lessonProgress?.is_completed || false;
                  const isInProgress = lessonProgress?.is_in_progress || false;

                  let isActive = false;
                  if (isInProgress) {
                    isActive = true;
                  } else if (i === 0) {
                    isActive = true;
                  } else {
                    const previousLesson = submodule.lessons[i - 1];
                    const previousProgress =
                      lessonProgressData[previousLesson._id];
                    const previousCompleted =
                      previousProgress?.is_completed || false;
                    isActive = previousCompleted;
                  }

                  if (isActive && !isCompleted) {
                    activeLesson = lesson;
                    const fullProgress = lessonProgresses?.find(
                      (p: any) => p.sanity_lesson_id === lesson._id
                    );
                    activeLessonProgress = fullProgress || lessonProgress;
                    break;
                  }
                }
              }

              // Build href based on current page type
              if (activeLesson && activeLessonProgress?.is_in_progress) {
                const currentPageType =
                  activeLessonProgress?.current_page_type || 'lesson';
                const currentPageNumber =
                  activeLessonProgress?.current_page_number || 1;

                let href = '';
                if (currentPageType === 'intro') {
                  href = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/intro/${currentPageNumber}`;
                } else if (currentPageType === 'activity') {
                  href = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/lessons/${activeLesson._id}/activities/${currentPageNumber}`;
                } else if (currentPageType === 'quiz') {
                  const quizId = activeLessonProgress?.current_quiz_id || '';
                  const questionNumber =
                    activeLessonProgress?.current_question_number || 1;
                  href = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/lessons/${activeLesson._id}/quizzes/${quizId}/pages/${questionNumber}`;
                } else {
                  // lesson type
                  href = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/lessons/${activeLesson._id}/pages/${currentPageNumber}`;
                }
                hrefData[submodule._id] = href;
              } else if (activeLesson) {
                // Not in progress but is next in line
                hrefData[submodule._id] =
                  `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/lessons/${activeLesson._id}/pages/1`;
              } else {
                // No active lesson - go to intro or first lesson (already set above if no progress)
                const hasIntro =
                  submodule.intro_pages && submodule.intro_pages.length > 0;
                if (hasIntro) {
                  hrefData[submodule._id] =
                    `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/intro/1`;
                } else if (submodule.lessons && submodule.lessons.length > 0) {
                  hrefData[submodule._id] =
                    `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/lessons/${submodule.lessons[0]._id}/pages/1`;
                } else {
                  // Fallback to submodule index
                  hrefData[submodule._id] =
                    `/(tabs)/Learn/modules/${moduleId}/${submodule._id}`;
                }
              }
            } catch (error) {
              console.error(
                `Error processing submodule ${submodule._id}:`,
                error
              );
              progressData[submodule._id] = {
                is_completed: false,
                progress_percent: 0,
                completed_lessons: 0,
                total_lessons: submodule.lessons?.length || 0,
              };
              // Fallback to submodule index
              hrefData[submodule._id] =
                `/(tabs)/Learn/modules/${moduleId}/${submodule._id}`;
            }
          })
        );

        setSubmoduleProgresses(progressData);
        setSubmoduleHrefs(hrefData);
      } catch (error) {
        console.error(
          '[ModuleIndex] Error fetching submodule progress:',
          error
        );
      }
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

  const updateRowBottom = (bottom: number, isLastModule: boolean) => {
    if (!isLastModule) return; // Only track the last module's bottom

    const b = clampNonNeg(bottom);
    if (Number.isFinite(b)) {
      setRailEnd(b);
    }
  };

  const railHeight = useMemo(() => {
    if (railEnd == null || progressBottom <= 0) return 0;
    // Rail should stop exactly at the last module's bottom
    return Math.max(0, railEnd - progressBottom);
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
            <Feather name='chevron-left' size={30} color='#111' />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{moduleData.title}</Text>
          </View>
          <View style={{ width: 34 }} />
        </View>

        {/* Description */}
        {!!moduleData.description && (
          <View style={styles.descriptionWrap}>
            <Text style={styles.subtitle}>{moduleData.description}</Text>
          </View>
        )}

        {/* Progress Card */}
        <View style={styles.progressCard} onLayout={onProgressLayout}>
          <Text style={styles.progressCentered}>
            Progress: {moduleProgressData.completed_submodules}/
            {moduleProgressData.total_submodules} sections completed
          </Text>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#D8492C', '#FFB570']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    100,
                    Math.max(0, moduleProgressData.progress_percent)
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Rail container */}
        <View
          style={styles.railContainer}
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

                  /* Line fix */
                  left: SCREEN_WIDTH / 2 - RAIL_W / 2 - 9,
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
              const ctaText = m.is_completed
                ? 'Review'
                : m.progress_percent > 0
                  ? 'Resume'
                  : 'Start';
              const disabled = !m.unlocked;

              // Row layout
              let rowTop = 0;
              let rowHeight = 0;

              // determine current
              const isCurrent =
                i === currentIndex && !m.is_completed && m.unlocked;

              // Check if this is the last module
              const isLastModule = i === submodules.length - 1;

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
                    updateRowBottom(absTop + rowHeight, isLastModule);
                    computeAhead(scrollRef.current.y, scrollRef.current.vh);
                  }}
                >
                  {/* Submodule card */}
                  <TouchableOpacity
                    activeOpacity={disabled ? 1 : 0.9}
                    onPress={async () => {
                      if (disabled) return;
                      // Navigate directly to current lesson page if href exists (resume state), otherwise fallback to submodule index
                      let href = submoduleHrefs[m.id];

                      // If href doesn't exist yet, calculate it on-demand (optimized version)
                      if (!href && m.progress_percent > 0) {
                        try {
                          const {
                            data: { user },
                          } = await progressClient.auth.getUser();
                          if (user) {
                            // Fetch lesson progress for this submodule
                            const { data: lessonProgresses } =
                              await progressClient
                                .from('user_lesson_progress')
                                .select('*')
                                .eq('sanity_submodule_id', m.id);

                            // Build lesson progress map from database results (faster than individual calls)
                            const lessonProgressData: { [key: string]: any } =
                              {};
                            const submodule = moduleData.submodules?.find(
                              s => s._id === m.id
                            );
                            if (submodule?.lessons && lessonProgresses) {
                              for (const lessonProgress of lessonProgresses) {
                                if (lessonProgress.sanity_lesson_id) {
                                  lessonProgressData[
                                    lessonProgress.sanity_lesson_id
                                  ] = {
                                    is_completed:
                                      lessonProgress.is_completed || false,
                                    is_in_progress:
                                      lessonProgress.is_in_progress || false,
                                  };
                                }
                              }

                              // For lessons without progress records, mark them as not started
                              for (const lesson of submodule.lessons) {
                                if (!lessonProgressData[lesson._id]) {
                                  lessonProgressData[lesson._id] = {
                                    is_completed: false,
                                    is_in_progress: false,
                                  };
                                }
                              }

                              // Find active lesson
                              let activeLesson = null;
                              let activeLessonProgress = null;

                              for (
                                let i = 0;
                                i < submodule.lessons.length;
                                i++
                              ) {
                                const lesson = submodule.lessons[i];
                                const lessonProgress =
                                  lessonProgressData[lesson._id];
                                const isCompleted =
                                  lessonProgress?.is_completed || false;
                                const isInProgress =
                                  lessonProgress?.is_in_progress || false;

                                let isActive = false;
                                if (isInProgress) {
                                  isActive = true;
                                } else if (i === 0) {
                                  isActive = true;
                                } else {
                                  const previousLesson =
                                    submodule.lessons[i - 1];
                                  const previousProgress =
                                    lessonProgressData[previousLesson._id];
                                  const previousCompleted =
                                    previousProgress?.is_completed || false;
                                  isActive = previousCompleted;
                                }

                                if (isActive && !isCompleted) {
                                  activeLesson = lesson;
                                  const fullProgress = lessonProgresses?.find(
                                    (p: any) =>
                                      p.sanity_lesson_id === lesson._id
                                  );
                                  activeLessonProgress =
                                    fullProgress || lessonProgress;
                                  break;
                                }
                              }

                              // Build href
                              if (
                                activeLesson &&
                                activeLessonProgress?.is_in_progress
                              ) {
                                const currentPageType =
                                  activeLessonProgress?.current_page_type ||
                                  'lesson';
                                const currentPageNumber =
                                  activeLessonProgress?.current_page_number ||
                                  1;

                                if (currentPageType === 'intro') {
                                  href = `/(tabs)/Learn/modules/${moduleId}/${m.id}/intro/${currentPageNumber}`;
                                } else if (currentPageType === 'activity') {
                                  href = `/(tabs)/Learn/modules/${moduleId}/${m.id}/lessons/${activeLesson._id}/activities/${currentPageNumber}`;
                                } else if (currentPageType === 'quiz') {
                                  const quizId =
                                    activeLessonProgress?.current_quiz_id || '';
                                  const questionNumber =
                                    activeLessonProgress?.current_question_number ||
                                    1;
                                  href = `/(tabs)/Learn/modules/${moduleId}/${m.id}/lessons/${activeLesson._id}/quizzes/${quizId}/pages/${questionNumber}`;
                                } else {
                                  href = `/(tabs)/Learn/modules/${moduleId}/${m.id}/lessons/${activeLesson._id}/pages/${currentPageNumber}`;
                                }
                              } else if (activeLesson) {
                                href = `/(tabs)/Learn/modules/${moduleId}/${m.id}/lessons/${activeLesson._id}/pages/1`;
                              }

                              // Cache the calculated href
                              if (href) {
                                setSubmoduleHrefs(prev => ({
                                  ...prev,
                                  [m.id]: href,
                                }));
                              }
                            }
                          }
                        } catch (error) {
                          console.error(
                            '[ModuleIndex] Error calculating href on-demand:',
                            error
                          );
                        }
                      }

                      if (href) {
                        // Use direct href if it exists (means there's an active lesson - either in progress or next to start)
                        router.push(href as any);
                      } else {
                        // No href, go to submodule index
                        router.push({
                          pathname:
                            '/(tabs)/Learn/modules/[moduleId]/[submoduleId]' as any,
                          params: { moduleId, submoduleId: m.id },
                        });
                      }
                    }}
                    style={[
                      styles.card,
                      styles.cardCentered,
                      (m as any).status === 'completed' && styles.cardCompleted,
                    ]}
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
                            backgroundColor: '#D8492C', // Hardcoded color for this page only
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
            <View style={styles.morePillContent}>
              <View style={styles.dots}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
              <Text style={styles.moreText}>
                {ahead} more module{ahead === 1 ? '' : 's'} ahead
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Disclaimer Modal */}
      <Modal
        visible={showDisclaimer}
        transparent={true}
        animationType='fade'
        onRequestClose={handleDisclaimerBack}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Disclaimer</Text>
            <View style={styles.modalTextContainer}>
              <Text style={styles.modalText}>
                This module is for educational purposes only. Unify does not
                provide legal or financial advice and makes no guarantee of
                accuracy, completeness, or applicability. Policies may change at
                any time, and Unify is not liable for any outcomes or losses
                resulting from use or reliance on this content. Always verify
                current requirements with official sources such as IRCC or
                qualified professionals.
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonBack}
                onPress={handleDisclaimerBack}
              >
                <Text style={styles.modalButtonBackText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButtonContinue,
                  {
                    backgroundColor:
                      moduleData?.colorTheme?.hex || '#D8492C',
                  },
                ]}
                onPress={handleDisclaimerContinue}
              >
                <Text style={styles.modalButtonContinueText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: '15%',
    marginBottom: 6,
  },
  backButton: { 
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  titleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: '#2B2B2B',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  descriptionWrap: {
    alignItems: 'center',
    marginBottom: 8,
    width: 345,
    alignSelf: 'center',
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
  progressFill: { height: '100%', borderRadius: 20 },

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
  cardCentered: { alignSelf: 'center', marginLeft: 3.5 },
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
    paddingLeft: 2,
  },
  ctaTextDisabled: { color: '#575757' },

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
    width: 195,
    height: 39,
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D1D1',
    borderWidth: 1,
    borderRadius: 20,
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
    fontWeight: '600',
    color: '#707070',
    marginRight: 12,
    marginLeft: 0,
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
    marginTop: 11 - (39 - 22) / 2,
    marginBottom: 16 - (39 - 22) / 2,
  },

  // Disclaimer Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 30,
    width: 353,
    alignItems: 'center',
  },
  modalTitle: {
    width: 293,
    height: 26,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: '#343434',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0,
  },
  modalTextContainer: {
    width: 293,
    height: 200,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: '#686464',
    textAlign: 'center',
    letterSpacing: 0,
    width: 293,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  modalButtonBack: {
    width: 139,
    height: 46,
    paddingTop: 12,
    paddingRight: 24,
    paddingBottom: 12,
    paddingLeft: 24,
    backgroundColor: '#E6E6E6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalButtonBackText: {
    width: 39,
    height: 22,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0,
  },
  modalButtonContinue: {
    width: 139,
    height: 46,
    paddingTop: 12,
    paddingRight: 24,
    paddingBottom: 12,
    paddingLeft: 24,
    backgroundColor: '#D8492C',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonContinueText: {
    width: 71,
    height: 22,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
  },
});
