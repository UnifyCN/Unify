import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
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
import Blob3 from '@/assets/images/Blob3.svg';
import Blob8 from '@/assets/images/Blob8.svg';
import Blob10 from '@/assets/images/Blob10.svg';
import Blob11 from '@/assets/images/Blob11.svg';
import Blob12 from '@/assets/images/Blob12.svg';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const TIMELINE_LEFT_WIDTH = 24;
const DOT_SIZE = 16;
const LINE_WIDTH = 2;
const DEFAULT_COLOR = '#4A7C59'; // Fallback green if no colorTheme

// Map Material UI icon names to MaterialCommunityIcons outline variants
const mapIconName = (iconName: string): string => {
  const iconMap: { [key: string]: string } = {
    AccountBalanceOutlined: 'bank-outline',
    AssignmentIndOutlined: 'account-tie-outline',
    CottageOutlined: 'home-outline',
    ArticleOutlined: 'file-document-outline',
    PassportOutlined: 'passport',
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
  const insets = useSafeAreaInsets();
  const { moduleId, blobIndex } = useLocalSearchParams<{ moduleId: string; blobIndex?: string }>();
  const {
    data: moduleData,
    isLoading,
    error,
  } = useSanityModuleWithSubmodules(moduleId || '');

  // Progress tracking
  const { moduleProgress, isLoading: progressLoading, refreshProgress } = useModuleProgress(
    moduleId || ''
  );
  const [submoduleProgresses, setSubmoduleProgresses] = useState<{
    [key: string]: any;
  }>({});
  const [submoduleHrefs, setSubmoduleHrefs] = useState<{
    [key: string]: string;
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
  const BlobComponent = blobIndexNum === 0 ? Blob3 : blobIndexNum === 1 ? Blob8 : blobIndexNum === 2 ? Blob10 : blobIndexNum === 3 ? Blob11 : Blob12;

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
    if (!moduleData?.submodules) return;
    (async () => {
      const progressData: { [key: string]: any } = {};
      const hrefData: { [key: string]: string } = {};

      try {
        const {
          data: { user },
        } = await progressClient.auth.getUser();
        if (!user) {
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

        await Promise.all(
          moduleData.submodules.map(async submodule => {
            try {
              const progress = await cachedProgressService.getSubmoduleProgress(
                moduleId || '',
                submodule._id
              );
              progressData[submodule._id] = progress;

              if (!progress?.progress_percent || progress.progress_percent === 0) {
                const hasIntro = submodule.intro_pages && submodule.intro_pages.length > 0;
                if (hasIntro) {
                  hrefData[submodule._id] = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/intro/1`;
                } else if (submodule.lessons && submodule.lessons.length > 0) {
                  hrefData[submodule._id] = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/lessons/${submodule.lessons[0]._id}/pages/1`;
                } else {
                  hrefData[submodule._id] = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}`;
                }
                return;
              }

              const { data: lessonProgresses } = await progressClient
                .from('user_lesson_progress')
                .select('*')
                .eq('sanity_submodule_id', submodule._id);

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

                for (const lesson of submodule.lessons) {
                  if (!lessonProgressData[lesson._id]) {
                    lessonProgressData[lesson._id] = {
                      is_completed: false,
                      is_in_progress: false,
                    };
                  }
                }
              }

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
                    const previousProgress = lessonProgressData[previousLesson._id];
                    const previousCompleted = previousProgress?.is_completed || false;
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

              if (activeLesson && activeLessonProgress?.is_in_progress) {
                const currentPageType = activeLessonProgress?.current_page_type || 'lesson';
                const currentPageNumber = activeLessonProgress?.current_page_number || 1;

                let href = '';
                if (currentPageType === 'intro') {
                  href = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/intro/${currentPageNumber}`;
                } else if (currentPageType === 'activity') {
                  href = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/lessons/${activeLesson._id}/activities/${currentPageNumber}`;
                } else if (currentPageType === 'quiz') {
                  const quizId = activeLessonProgress?.current_quiz_id || '';
                  const questionNumber = activeLessonProgress?.current_question_number || 1;
                  href = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/lessons/${activeLesson._id}/quizzes/${quizId}/pages/${questionNumber}`;
                } else {
                  href = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/lessons/${activeLesson._id}/pages/${currentPageNumber}`;
                }
                hrefData[submodule._id] = href;
              } else if (activeLesson) {
                hrefData[submodule._id] = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/lessons/${activeLesson._id}/pages/1`;
              } else {
                const hasIntro = submodule.intro_pages && submodule.intro_pages.length > 0;
                if (hasIntro) {
                  hrefData[submodule._id] = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/intro/1`;
                } else if (submodule.lessons && submodule.lessons.length > 0) {
                  hrefData[submodule._id] = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}/lessons/${submodule.lessons[0]._id}/pages/1`;
                } else {
                  hrefData[submodule._id] = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}`;
                }
              }
            } catch (err) {
              console.error(`Error processing submodule ${submodule._id}:`, err);
              progressData[submodule._id] = {
                is_completed: false,
                progress_percent: 0,
                completed_lessons: 0,
                total_lessons: submodule.lessons?.length || 0,
              };
              hrefData[submodule._id] = `/(tabs)/Learn/modules/${moduleId}/${submodule._id}`;
            }
          })
        );

        setSubmoduleProgresses(progressData);
        setSubmoduleHrefs(hrefData);
      } catch (err) {
        console.error('[ModuleIndex] Error fetching submodule progress:', err);
      }
    })();
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
          for (const submodule of moduleData.submodules) {
            try {
              progressData[submodule._id] = await cachedProgressService.getSubmoduleProgress(
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

  // Initialize openedCardId to the current active section
  useEffect(() => {
    if (currentIndex >= 0 && moduleData?.submodules?.[currentIndex]) {
      setOpenedCardId(moduleData.submodules[currentIndex]._id);
    }
  }, [currentIndex, moduleData?.submodules]);

  // Build section view models with explicit UI states
  const sections: SectionViewModel[] = useMemo(() => {
    if (!moduleData?.submodules) return [];

    return moduleData.submodules.map((s, i) => {
      const progress = submoduleProgresses[s._id];
      const isCompleted = progress?.is_completed || false;
      const progressPercent = progress?.progress_percent || 0;
      const unlocked =
        i === 0 ||
        (i > 0 && submoduleProgresses[moduleData.submodules[i - 1]._id]?.is_completed);

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
    if (section.uiState === 'locked') return;

    // If tapping the already-opened card, navigate
    if (openedCardId === section.id) {
      await navigateToSection(section);
    } else {
      // Otherwise, open this card
      setOpenedCardId(section.id);
    }
  };

  // Navigate to section
  const navigateToSection = async (section: SectionViewModel) => {
    let href = submoduleHrefs[section.id];

    // Calculate href on-demand if needed
    if (!href && section.progressPercent > 0) {
      try {
        const { data: { user } } = await progressClient.auth.getUser();
        if (user) {
          const { data: lessonProgresses } = await progressClient
            .from('user_lesson_progress')
            .select('*')
            .eq('sanity_submodule_id', section.id);

          const submodule = moduleData?.submodules?.find(s => s._id === section.id);
          if (submodule?.lessons && lessonProgresses) {
            const lessonProgressData: { [key: string]: any } = {};
            for (const lessonProgress of lessonProgresses) {
              if (lessonProgress.sanity_lesson_id) {
                lessonProgressData[lessonProgress.sanity_lesson_id] = {
                  is_completed: lessonProgress.is_completed || false,
                  is_in_progress: lessonProgress.is_in_progress || false,
                };
              }
            }

            for (const lesson of submodule.lessons) {
              if (!lessonProgressData[lesson._id]) {
                lessonProgressData[lesson._id] = { is_completed: false, is_in_progress: false };
              }
            }

            let activeLesson = null;
            let activeLessonProgress = null;

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
                const previousProgress = lessonProgressData[previousLesson._id];
                isActive = previousProgress?.is_completed || false;
              }

              if (isActive && !isCompleted) {
                activeLesson = lesson;
                activeLessonProgress = lessonProgresses?.find(
                  (p: any) => p.sanity_lesson_id === lesson._id
                ) || lessonProgress;
                break;
              }
            }

            if (activeLesson && activeLessonProgress?.is_in_progress) {
              const currentPageType = activeLessonProgress?.current_page_type || 'lesson';
              const currentPageNumber = activeLessonProgress?.current_page_number || 1;

              if (currentPageType === 'intro') {
                href = `/(tabs)/Learn/modules/${moduleId}/${section.id}/intro/${currentPageNumber}`;
              } else if (currentPageType === 'activity') {
                href = `/(tabs)/Learn/modules/${moduleId}/${section.id}/lessons/${activeLesson._id}/activities/${currentPageNumber}`;
              } else if (currentPageType === 'quiz') {
                const quizId = activeLessonProgress?.current_quiz_id || '';
                const questionNumber = activeLessonProgress?.current_question_number || 1;
                href = `/(tabs)/Learn/modules/${moduleId}/${section.id}/lessons/${activeLesson._id}/quizzes/${quizId}/pages/${questionNumber}`;
              } else {
                href = `/(tabs)/Learn/modules/${moduleId}/${section.id}/lessons/${activeLesson._id}/pages/${currentPageNumber}`;
              }
            } else if (activeLesson) {
              href = `/(tabs)/Learn/modules/${moduleId}/${section.id}/lessons/${activeLesson._id}/pages/1`;
            }

            if (href) {
              setSubmoduleHrefs(prev => ({ ...prev, [section.id]: href }));
            }
          }
        }
      } catch (err) {
        console.error('[ModuleIndex] Error calculating href on-demand:', err);
      }
    }

    if (href) {
      router.push(href as any);
    } else {
      router.push({
        pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]' as any,
        params: { moduleId, submoduleId: section.id },
      });
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
            isOpened && { backgroundColor: subjectColor, borderColor: subjectColor },
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
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading module…</Text>
      </View>
    );
  }

  if (error || !moduleData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Error loading module: {error?.message || 'Unknown error'}
        </Text>
        <Link href="/(tabs)/Learn">Go back to Learn</Link>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Colored Header */}
      <View style={[styles.header, { backgroundColor: subjectColor, paddingTop: insets.top }]}>
        {/* Blob background overlay */}
        <View style={blobIndexNum === 0 ? styles.blob3Container : blobIndexNum === 1 ? styles.blob8Container : blobIndexNum === 2 ? styles.blob10Container : blobIndexNum === 3 ? styles.blob11Container : styles.blob12Container}>
          <BlobComponent 
            width={400} 
            height={400}
            fill="#FFFFFF"
            opacity={0.3}
          />
        </View>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/Learn')}
            style={styles.backButton}
          >
            <Feather name="chevron-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {moduleData.icon && (
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons
                name={mapIconName(moduleData.icon) as any}
                size={30}
                color="#FFFFFF"
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
            <Text style={styles.headerDescription} numberOfLines={3}>
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

      {/* Disclaimer Modal */}
      <Modal
        visible={showDisclaimer}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDisclaimerBack}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Disclaimer</Text>
            <View style={styles.modalTextContainer}>
              <Text style={styles.modalText}>
                This module is for educational purposes only. Unify does not
                provide legal or financial advice and makes no guarantee of
                accuracy, completeness, or applicability. Always verify
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
                style={[styles.modalButtonContinue, { backgroundColor: subjectColor }]}
                onPress={handleDisclaimerContinue}
              >
                <Text style={styles.modalButtonContinueText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 24, // Matches user preference
    fontWeight: '800',
    color: '#FFFFFF',
    paddingLeft: 16, // Kept user's padding
  },
  headerDescriptionWrap: {
    paddingHorizontal: 16,
    marginTop: 4,
    paddingBottom: 4,
  },
  headerDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
    marginLeft: 16, // Aligns with paddingLeft of title
  },
  headerRightPlaceholder: {
    width: 44,
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
    backgroundColor: 'transparent',
    borderLeftWidth: LINE_WIDTH,
    borderColor: '#D1D1D1',
    borderStyle: 'dotted',
    width: 0, // borderLeftWidth takes space
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
