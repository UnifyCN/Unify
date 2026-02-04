import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ViewStyle,
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
import { progressClient } from '@/services/progress/progressClient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModuleIndexSkeletonLoader } from '@/components/learn/module-index-skeleton-loader';
import Blob3 from '@/assets/images/Blob3.svg';
import Blob8 from '@/assets/images/Blob8.svg';
import Blob10 from '@/assets/images/Blob10.svg';
import Blob11 from '@/assets/images/Blob11.svg';
import Blob12 from '@/assets/images/Blob12.svg';
import { useAnalytics } from '@/utils/analytics';
import { Layout } from '@/constants/Layout';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const TIMELINE_LEFT_WIDTH = 24;
const DOT_SIZE = 16;
const LINE_WIDTH = 2;
const DEFAULT_COLOR = '#4A7C59'; // Fallback green if no colorTheme

// Map Sanity icon values (snake_case) to MaterialCommunityIcons outline variants
const mapIconName = (iconName: string): string => {
  const iconMap: { [key: string]: string } = {
    // Original icons (keeping for backward compatibility)
    AccountBalanceOutlined: 'bank-outline',
    AssignmentIndOutlined: 'account-tie-outline',
    CottageOutlined: 'home-outline',
    ArticleOutlined: 'file-document-outline',
    PassportOutlined: 'passport',
    // New Sanity icon values (snake_case)
    account_balance: 'bank-outline',
    assignment_ind: 'account-tie-outline',
    cottage: 'home-outline',
    article: 'file-document-outline',
    passport: 'passport',
    school: 'school-outline',
    book: 'book-outline',
    work: 'briefcase-outline',
    computer: 'laptop-outline',
    business: 'office-building-outline',
    science: 'flask-outline',
    language: 'translate',
    history: 'clock-time-four-outline',
    psychology: 'brain',
    menu_book: 'book-open-page-variant',
    auto_stories: 'book-open-outline',
    calculate: 'calculator',
    palette: 'palette-outline',
    music_note: 'music-note-outline',
    sports_esports: 'gamepad-variant-outline',
  };
  return iconMap[iconName] || 'bank-outline';
};

type SectionUIState = 'completed' | 'active' | 'unlocked' | 'locked';

interface SectionViewModel {
  id: string;
  title: string;
  lessonCount: number;
  uiState: SectionUIState;
  ctaLabel: 'Review' | 'Continue' | 'Start' | null;
  progressPercent: number;
  isCompleted: boolean;
  unlocked: boolean;
}

const getSectionStyles = (
  section: SectionViewModel,
  prevSection: SectionViewModel | null,
  nextSection: SectionViewModel | null,
  subjectColor: string
) => {
  // Dot Style
  let dotStyle: ViewStyle[] = [styles.dot];
  if (section.uiState === 'completed') {
    dotStyle.push({ backgroundColor: subjectColor });
  } else if (section.uiState === 'active' || section.uiState === 'unlocked') {
    dotStyle.push({
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: subjectColor,
    });
  } else {
    // Locked
    dotStyle.push({
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: '#D1D1D1',
    });
  }

  // Line Above Style (connects from prev dot to this dot)
  let lineAboveStyle: ViewStyle[] = [styles.lineSegment];
  if (prevSection) {
    if (
      prevSection.uiState === 'completed' &&
      section.uiState === 'completed'
    ) {
      lineAboveStyle.push({ backgroundColor: subjectColor });
    } else if (
      prevSection.uiState === 'completed' &&
      (section.uiState === 'active' || section.uiState === 'unlocked')
    ) {
      lineAboveStyle.push(styles.lineDotted);
      lineAboveStyle.push({ borderColor: subjectColor });
    } else {
      lineAboveStyle.push(styles.lineDotted);
    }
  }

  // Line Below Style (connects from this dot to next dot)
  let lineBelowStyle: ViewStyle[] = [styles.lineSegment];
  if (nextSection) {
    if (
      section.uiState === 'completed' &&
      nextSection.uiState === 'completed'
    ) {
      lineBelowStyle.push({ backgroundColor: subjectColor });
    } else if (
      section.uiState === 'completed' &&
      (nextSection.uiState === 'active' || nextSection.uiState === 'unlocked')
    ) {
      lineBelowStyle.push(styles.lineDotted);
      lineBelowStyle.push({ borderColor: subjectColor });
    } else {
      lineBelowStyle.push(styles.lineDotted);
    }
  }

  return { dotStyle, lineAboveStyle, lineBelowStyle };
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ModuleIndex() {
  const router = useRouter();
  const { trackScreen, trackModuleViewed } = useAnalytics();
  const insets = useSafeAreaInsets();
  const { moduleId, blobIndex } = useLocalSearchParams<{
    moduleId: string;
    blobIndex?: string;
  }>();
  const {
    data: moduleData,
    isLoading,
    error,
  } = useSanityModuleWithSubmodules(moduleId || '');

  // Progress tracking
  const {
    moduleProgress,
    isLoading: progressLoading,
    refreshProgress,
  } = useModuleProgress(moduleId || '');
  const [submoduleProgresses, setSubmoduleProgresses] = useState<{
    [key: string]: any;
  }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Disclaimer modal state
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Opened card state (for tap-to-open behavior)
  const [openedCardId, setOpenedCardId] = useState<string | null>(null);

  // Subject color from Sanity
  const subjectColor = moduleData?.colorTheme?.hex || DEFAULT_COLOR;

  // Determine which blob to use based on blobIndex param, or default to 0
  const blobIndexNum = blobIndex ? parseInt(blobIndex, 10) % 5 : 0;
  const BlobComponent =
    blobIndexNum === 0
      ? Blob3
      : blobIndexNum === 1
        ? Blob8
        : blobIndexNum === 2
          ? Blob10
          : blobIndexNum === 3
            ? Blob11
            : Blob12;

  // Check if disclaimer should be shown (first time opening this module with 0% progress)
  useEffect(() => {
    const checkDisclaimer = async () => {
      if (!moduleId || !moduleData?.title) return;

      const overallPercent = moduleProgress?.progress_percent ?? 0;
      if (overallPercent > 0) return;

      try {
        const storageKey = `disclaimerSeen_${moduleId}`;
        const hasSeen = await AsyncStorage.getItem(storageKey);
        if (!hasSeen) {
          setShowDisclaimer(true);
        }
      } catch (err) {
        console.error('[Disclaimer] Error checking disclaimer status:', err);
      }
    };

    if (moduleData && !isLoading && !error && !progressLoading) {
      checkDisclaimer();
    }
  }, [moduleId, moduleData, isLoading, error, progressLoading, moduleProgress]);

  const handleDisclaimerContinue = async () => {
    if (!moduleId) return;
    try {
      const storageKey = `disclaimerSeen_${moduleId}`;
      await AsyncStorage.setItem(storageKey, 'true');
      setShowDisclaimer(false);
    } catch (err) {
      console.error('Error saving disclaimer status:', err);
    }
  };

  const handleDisclaimerBack = () => {
    setShowDisclaimer(false);
    router.replace('/(tabs)/Learn');
  };

  // Fetch submodule progress and determine resume destinations
  useEffect(() => {
    if (!moduleData?.submodules || !Array.isArray(moduleData.submodules))
      return;

    let cancelled = false;

    (async () => {
      const progressData: { [key: string]: any } = {};

      try {
        let user = null;
        let userError = null;

        try {
          const userResult = await progressClient.auth.getUser();
          user = userResult?.data?.user || null;
          userError = userResult?.error || null;
        } catch (authError: any) {
          console.error('[ModuleIndex] Error getting user:', authError);
          userError = authError;
          // Continue with cached progress for non-authenticated users
        }

        if (userError) {
          console.error('[ModuleIndex] User error:', userError);
          // Continue with cached progress for non-authenticated users
        }

        if (!user) {
          if (Array.isArray(moduleData.submodules)) {
            for (const submodule of moduleData.submodules) {
              if (!submodule?._id) continue;
              try {
                const progress =
                  await cachedProgressService.getSubmoduleProgress(
                    moduleId || '',
                    submodule._id
                  );
                if (progress) {
                  progressData[submodule._id] = progress;
                } else {
                  progressData[submodule._id] = {
                    is_completed: false,
                    progress_percent: 0,
                    completed_lessons: 0,
                    total_lessons: Array.isArray(submodule.lessons)
                      ? submodule.lessons.length
                      : 0,
                  };
                }
              } catch (err) {
                console.error(
                  `Error fetching progress for submodule ${submodule._id}:`,
                  err
                );
                progressData[submodule._id] = {
                  is_completed: false,
                  progress_percent: 0,
                  completed_lessons: 0,
                  total_lessons: Array.isArray(submodule.lessons)
                    ? submodule.lessons.length
                    : 0,
                };
              }
            }
          }
          if (!cancelled) {
            setSubmoduleProgresses(progressData);
          }
          return;
        }

        if (!Array.isArray(moduleData.submodules)) {
          if (!cancelled) {
            setSubmoduleProgresses(progressData);
          }
          return;
        }

        try {
          await Promise.all(
            moduleData.submodules.map(async submodule => {
              if (!submodule?._id) {
                return;
              }

              try {
                const progress =
                  await cachedProgressService.getSubmoduleProgress(
                    moduleId || '',
                    submodule._id
                  );
                if (progress) {
                  progressData[submodule._id] = progress;
                } else {
                  progressData[submodule._id] = {
                    is_completed: false,
                    progress_percent: 0,
                    completed_lessons: 0,
                    total_lessons: Array.isArray(submodule.lessons)
                      ? submodule.lessons.length
                      : 0,
                  };
                }

                if (
                  !progress?.progress_percent ||
                  progress.progress_percent === 0
                ) {
                  return;
                }

                let lessonProgresses = null;
                let progressError = null;

                try {
                  const progressResult = await progressClient
                    .from('user_lesson_progress')
                    .select(
                      'sanity_lesson_id,is_completed,is_in_progress,current_page_type,current_page_number,current_quiz_id,current_question_number'
                    )
                    .eq('user_id', user.id)
                    .eq('sanity_submodule_id', submodule._id);

                  lessonProgresses = progressResult?.data || null;
                  progressError = progressResult?.error || null;
                } catch (queryError: any) {
                  console.error(
                    `Error fetching lesson progress for submodule ${submodule._id}:`,
                    queryError
                  );
                  progressError = queryError;
                  lessonProgresses = null;
                }

                if (progressError) {
                  console.error(
                    `Progress error for submodule ${submodule._id}:`,
                    progressError
                  );
                  // Continue with default fallback
                }

                const lessonProgressData: { [key: string]: any } = {};
                if (
                  submodule.lessons &&
                  Array.isArray(lessonProgresses) &&
                  !progressError
                ) {
                  for (const lessonProgress of lessonProgresses) {
                    if (lessonProgress?.sanity_lesson_id) {
                      lessonProgressData[lessonProgress.sanity_lesson_id] = {
                        is_completed: Boolean(lessonProgress.is_completed),
                        is_in_progress: Boolean(lessonProgress.is_in_progress),
                      };
                    }
                  }

                  if (Array.isArray(submodule.lessons)) {
                    for (const lesson of submodule.lessons) {
                      if (lesson?._id && !lessonProgressData[lesson._id]) {
                        lessonProgressData[lesson._id] = {
                          is_completed: false,
                          is_in_progress: false,
                        };
                      }
                    }
                  }
                }

                let activeLesson = null;
                let activeLessonProgress = null;

                if (submodule.lessons) {
                  for (let i = 0; i < submodule.lessons.length; i++) {
                    const lesson = submodule.lessons[i];
                    if (!lesson?._id) continue;

                    const lessonProgress = lessonProgressData[lesson._id];
                    const isCompleted = Boolean(lessonProgress?.is_completed);
                    const isInProgress = Boolean(
                      lessonProgress?.is_in_progress
                    );

                    let isActive = false;
                    if (isInProgress) {
                      isActive = true;
                    } else if (i === 0) {
                      isActive = true;
                    } else {
                      const previousLesson = submodule.lessons[i - 1];
                      if (previousLesson?._id) {
                        const previousProgress =
                          lessonProgressData[previousLesson._id];
                        isActive = Boolean(previousProgress?.is_completed);
                      }
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

                if (activeLesson?._id) {
                  // Progress is used for UI; navigation goes to submodule index
                }
              } catch (err) {
                console.error(
                  `Error processing submodule ${submodule._id}:`,
                  err
                );
                if (submodule?._id) {
                  progressData[submodule._id] = {
                    is_completed: false,
                    progress_percent: 0,
                    completed_lessons: 0,
                    total_lessons: Array.isArray(submodule.lessons)
                      ? submodule.lessons.length
                      : 0,
                  };
                }
              }
            })
          );
        } catch (promiseError: any) {
          console.error('[ModuleIndex] Error in Promise.all:', promiseError);
          // Continue with whatever data we have so far
        }

        if (!cancelled) {
          setSubmoduleProgresses(progressData);
        }
      } catch (err) {
        console.error('[ModuleIndex] Error fetching submodule progress:', err);
        // Set empty progress data on error to prevent UI from breaking
        try {
          const fallbackProgress: { [key: string]: any } = {};
          if (moduleData?.submodules) {
            for (const submodule of moduleData.submodules) {
              if (submodule?._id) {
                fallbackProgress[submodule._id] = {
                  is_completed: false,
                  progress_percent: 0,
                  completed_lessons: 0,
                  total_lessons: submodule.lessons?.length || 0,
                };
              }
            }
          }
          if (!cancelled) {
            setSubmoduleProgresses(fallbackProgress);
          }
        } catch (fallbackError) {
          console.error(
            '[ModuleIndex] Error setting fallback progress:',
            fallbackError
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [moduleData?.submodules, moduleId]);

  // Refetch progress when screen focuses
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const run = async () => {
        if (!cancelled) setIsRefreshing(true);

        try {
          if (!cancelled) await refreshProgress();

          if (!moduleData?.submodules) {
            if (!cancelled) setIsRefreshing(false);
            return;
          }

          const progressData: { [key: string]: any } = {};
          if (Array.isArray(moduleData.submodules)) {
            for (const submodule of moduleData.submodules) {
              if (!submodule?._id) continue;
              try {
                const progress =
                  await cachedProgressService.getSubmoduleProgress(
                    moduleId || '',
                    submodule._id
                  );
                if (progress) {
                  progressData[submodule._id] = progress;
                } else {
                  progressData[submodule._id] = {
                    is_completed: false,
                    progress_percent: 0,
                    completed_lessons: 0,
                    total_lessons: Array.isArray(submodule.lessons)
                      ? submodule.lessons.length
                      : 0,
                  };
                }
              } catch (err: any) {
                console.error(
                  `Error refreshing progress for submodule ${submodule._id}:`,
                  err
                );
                progressData[submodule._id] = {
                  is_completed: false,
                  progress_percent: 0,
                  completed_lessons: 0,
                  total_lessons: Array.isArray(submodule.lessons)
                    ? submodule.lessons.length
                    : 0,
                };
              }
            }
          }
          if (!cancelled) {
            setSubmoduleProgresses(progressData);
            setIsRefreshing(false);
          }
        } catch (err) {
          console.error('Error refreshing progress:', err);
          if (!cancelled) setIsRefreshing(false);
        }
      };
      run();
      return () => {
        cancelled = true;
        setIsRefreshing(false);
      };
    }, [moduleId, moduleData?.submodules, refreshProgress])
  );

  // Track module view
  const moduleTitle = moduleData?.title;
  const submoduleCount = moduleData?.submodules?.length || 0;
  const lastTrackedRef = useRef<number>(0);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (moduleTitle && moduleId && now - lastTrackedRef.current > 500) {
        trackScreen(`Module: ${moduleTitle}`);
        trackModuleViewed(moduleId, moduleTitle, submoduleCount);
        lastTrackedRef.current = now;
      }
    }, [moduleTitle, submoduleCount, moduleId, trackScreen, trackModuleViewed])
  );

  // Which submodule is the next one the user should do?
  const currentIndex = useMemo(() => {
    if (!moduleData?.submodules) return -1;
    for (let i = 0; i < moduleData.submodules.length; i++) {
      const id = moduleData.submodules[i]._id;
      const p = submoduleProgresses[id];
      if (!p?.is_completed) return i;
    }
    return -1; // all done
  }, [moduleData?.submodules, submoduleProgresses]);

  // Determine which section should be highlighted (next to complete, or first if all done)
  // This finds the first unlocked section that is not completed (Start or Continue)
  const highlightedSectionId = useMemo(() => {
    if (!moduleData?.submodules || moduleData.submodules.length === 0)
      return null;

    // Find the first unlocked section that is not completed
    for (let i = 0; i < moduleData.submodules.length; i++) {
      const submodule = moduleData.submodules[i];
      const progress = submoduleProgresses[submodule._id];
      const isCompleted = progress?.is_completed || false;

      // All sections are now unlocked at all times
      const unlocked = true;

      // If unlocked and not completed, this is the section to highlight (Start or Continue)
      if (unlocked && !isCompleted) {
        return submodule._id;
      }
    }

    // If all sections are completed, highlight the first one
    return moduleData.submodules[0]._id;
  }, [moduleData?.submodules, submoduleProgresses]);

  // Initialize openedCardId to the highlighted section when data is ready
  useEffect(() => {
    // Only set when we have data loaded and a highlighted section
    if (
      highlightedSectionId &&
      !isLoading &&
      !progressLoading &&
      moduleData?.submodules
    ) {
      // Always update to the highlighted section when opening the module
      // This ensures the correct section is highlighted even if user navigated away and came back
      setOpenedCardId(highlightedSectionId);
    }
  }, [
    highlightedSectionId,
    isLoading,
    progressLoading,
    moduleData?.submodules,
  ]);

  // Build section view models with explicit UI states
  const sections: SectionViewModel[] = useMemo(() => {
    if (!moduleData?.submodules) return [];

    return moduleData.submodules.map((s, i) => {
      const progress = submoduleProgresses[s._id];
      const isCompleted = progress?.is_completed || false;
      // Coerce/clamp progressPercent to ensure it's a valid number in 0-100 range
      const raw = progress?.progress_percent;
      const n = typeof raw === 'number' ? raw : Number(raw);
      const progressPercent = Number.isFinite(n)
        ? Math.max(0, Math.min(100, n))
        : 0;
      // All sections are now unlocked at all times
      const unlocked = true;

      // Determine UI state
      let uiState: SectionUIState;
      let ctaLabel: 'Review' | 'Continue' | 'Start' | null;

      if (isCompleted) {
        uiState = 'completed';
        ctaLabel = 'Review';
      } else if (unlocked && progressPercent > 0) {
        uiState = 'active';
        ctaLabel = 'Continue';
      } else if (unlocked) {
        uiState = 'unlocked';
        ctaLabel = 'Start';
      } else {
        uiState = 'locked';
        ctaLabel = null;
      }

      return {
        id: s._id,
        title: s.title,
        lessonCount: s.lessons?.length || 0,
        uiState,
        ctaLabel,
        progressPercent,
        isCompleted,
        unlocked,
      };
    });
  }, [moduleData?.submodules, submoduleProgresses, currentIndex]);

  // Handle card tap
  const handleCardTap = async (section: SectionViewModel) => {
    // All sections are now unlocked, so no need to check locked state

    // If tapping the already-opened card, navigate
    if (openedCardId === section.id) {
      await navigateToSection(section);
    } else {
      // Otherwise, open this card
      setOpenedCardId(section.id);
    }
  };

  // Navigate to submodule index when user taps Start / Continue / Review
  const navigateToSection = async (section: SectionViewModel) => {
    try {
      if (!section?.id || !moduleId) {
        console.error('[ModuleIndex] Missing required params for navigation');
        return;
      }
      router.push({
        pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]' as any,
        params: { moduleId, submoduleId: section.id },
      });
    } catch (navError: any) {
      console.error('[ModuleIndex] Error navigating to section:', navError);
      try {
        router.replace('/(tabs)/Learn');
      } catch (fallbackError: any) {
        console.error(
          '[ModuleIndex] Error in fallback navigation:',
          fallbackError
        );
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────────

  // Section card
  const renderSectionCard = (section: SectionViewModel, index: number) => {
    const isOpened = openedCardId === section.id;
    const isLocked = section.uiState === 'locked';
    const isFirst = index === 0;
    const isLast = index === sections.length - 1;

    const { dotStyle, lineAboveStyle, lineBelowStyle } = getSectionStyles(
      section,
      isFirst ? null : sections[index - 1],
      isLast ? null : sections[index + 1],
      subjectColor
    );

    return (
      <View key={section.id} style={styles.sectionRow}>
        {/* Left timeline column with lines and dot */}
        <View style={styles.timelineColumn}>
          {/* Main Part: Aligns with card content */}
          <View style={styles.timelineContent}>
            {/* Line above dot */}
            <View style={styles.lineHalf}>
              {!isFirst && <View style={[...lineAboveStyle, { flex: 1 }]} />}
            </View>

            {/* Dot */}
            <View style={dotStyle} />

            {/* Line below dot */}
            <View style={styles.lineHalf}>
              {!isLast && <View style={[...lineBelowStyle, { flex: 1 }]} />}
            </View>
          </View>

          {/* Gap Extension Part: Extends line through the padding */}
          {!isLast && (
            <View style={styles.timelineGap}>
              <View style={[...lineBelowStyle, { flex: 1 }]} />
            </View>
          )}
        </View>

        {/* Card */}
        <TouchableOpacity
          activeOpacity={isLocked ? 1 : 0.8}
          onPress={() => handleCardTap(section)}
          style={[
            styles.card,
            isOpened && {
              backgroundColor: subjectColor,
              borderColor: subjectColor,
            },
            isLocked && styles.cardLocked,
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              isOpened && styles.cardTitleOpened,
              isLocked && styles.textLocked,
            ]}
          >
            {section.title}
          </Text>
          <Text
            style={[
              styles.lessonCount,
              isOpened && styles.lessonCountOpened,
              isLocked && styles.textLocked,
            ]}
          >
            {section.lessonCount} Lesson{section.lessonCount !== 1 ? 's' : ''}
          </Text>

          {/* CTA Button - only show on opened card */}
          {isOpened && section.ctaLabel && (
            <View onStartShouldSetResponder={() => true}>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => navigateToSection(section)}
              >
                <Text style={[styles.ctaText, { color: subjectColor }]}>
                  {section.ctaLabel}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Loading / Error states
  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoading || progressLoading || isRefreshing) {
    return <ModuleIndexSkeletonLoader />;
  }

  if (error || !moduleData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Error loading module: {error?.message || 'Unknown error'}
        </Text>
        <Link href='/(tabs)/Learn'>Go back to Learn</Link>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Colored Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: subjectColor,
            paddingTop: insets.top + Layout.header.topInsetOffset,
          },
        ]}
      >
        {/* Blob background overlay */}
        <View
          style={
            blobIndexNum === 0
              ? styles.blob3Container
              : blobIndexNum === 1
                ? styles.blob8Container
                : blobIndexNum === 2
                  ? styles.blob10Container
                  : blobIndexNum === 3
                    ? styles.blob11Container
                    : styles.blob12Container
          }
        >
          <BlobComponent
            width={400}
            height={400}
            fill='#FFFFFF'
            opacity={0.3}
          />
        </View>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/Learn')}
            style={styles.backButton}
          >
            <Feather
              name='chevron-left'
              size={Layout.header.iconSize}
              color='#FFFFFF'
            />
          </TouchableOpacity>
          {moduleData.icon && (
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons
                name={mapIconName(moduleData.icon) as any}
                size={30}
                color='#FFFFFF'
              />
            </View>
          )}
          {!moduleData.icon && <View style={styles.headerRightPlaceholder} />}
        </View>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{moduleData.title}</Text>
        </View>

        {moduleData.description && (
          <View style={styles.headerDescriptionWrap}>
            <Text style={styles.headerDescription}>
              {moduleData.description}
            </Text>
          </View>
        )}
      </View>

      {/* Sections list with timeline */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, index) => renderSectionCard(section, index))}
        <View style={{ height: 40 }} />
      </ScrollView>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.header.horizontalPadding,
    minHeight: Layout.header.rowHeight,
  },
  backButton: {
    width: Layout.header.rowHeight,
    height: Layout.header.rowHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    paddingHorizontal: Layout.header.horizontalPadding,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 24, // Matches user preference
    fontWeight: '800',
    color: '#FFFFFF',
    paddingLeft: Layout.header.horizontalPadding,
  },
  headerDescriptionWrap: {
    paddingHorizontal: Layout.header.horizontalPadding,
    marginTop: 4,
    paddingBottom: 4,
  },
  headerDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
    marginLeft: Layout.header.horizontalPadding,
  },
  headerRightPlaceholder: {
    width: Layout.header.rowHeight,
  },
  headerIconContainer: {
    width: 47,
    height: 47,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  // Blob containers - scaled up 2.5x from PathwayCard (160x160 -> 400x400)
  blob3Container: {
    position: 'absolute',
    top: -170,
    right: -175,
    width: 400,
    height: 400,
    overflow: 'hidden',
    transform: [{ rotate: '-45deg' }],
  },
  blob8Container: {
    position: 'absolute',
    top: -187.5,
    right: -187.5,
    width: 400,
    height: 400,
    overflow: 'hidden',
    transform: [{ rotate: '35deg' }],
  },
  blob10Container: {
    position: 'absolute',
    top: -200,
    right: 225,
    width: 400,
    height: 400,
    overflow: 'hidden',
    transform: [{ rotate: '45deg' }],
  },
  blob11Container: {
    position: 'absolute',
    top: -250,
    right: 215,
    width: 400,
    height: 400,
    overflow: 'hidden',
    transform: [{ rotate: '-35deg' }],
  },
  blob12Container: {
    position: 'absolute',
    top: 25,
    right: 105,
    width: 400,
    height: 400,
    overflow: 'hidden',
    transform: [{ rotate: '13deg' }],
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingLeft: 16,
    paddingRight: 32,
  },

  // Section row
  sectionRow: {
    flexDirection: 'row',
    minHeight: 70,
    paddingBottom: 12, // Gap between cards
  },

  // Timeline column
  timelineColumn: {
    width: TIMELINE_LEFT_WIDTH, // Reduced width for tighter spacing
    alignItems: 'center',
    flexDirection: 'column',
  },
  timelineContent: {
    flex: 1, // Matches card height
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  timelineGap: {
    height: 12, // Matches sectionRow paddingBottom
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: -12,
  },
  lineHalf: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  lineSegment: {
    width: LINE_WIDTH,
    backgroundColor: '#D1D1D1',
  },
  lineDotted: {
    width: LINE_WIDTH,
    backgroundColor: '#D1D1D1',
    opacity: 0.4, // Reduced opacity to indicate inactive state
  },

  // Dots
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // default
  },
  // (Specific dot styles handled in helper via dynamic styles)

  // Card
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10, // Slightly reduced padding
    marginLeft: 16, // Explicit gap from timeline
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLocked: {
    opacity: 0.5,
  },
  cardTitle: {
    fontSize: 16, // Reduced font size
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  cardTitleOpened: {
    color: '#FFFFFF',
  },
  lessonCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888888',
  },
  lessonCountOpened: {
    color: 'rgba(255,255,255,0.85)',
  },
  textLocked: {
    color: '#AAAAAA',
  },

  // CTA Button
  ctaButton: {
    height: 30, // Reduced height
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8, // Reduced margin
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Loading / Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  modalTextContainer: {
    marginBottom: 24,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButtonBack: {
    flex: 1,
    height: 48,
    backgroundColor: '#E5E5E5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonBackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalButtonContinue: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonContinueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
