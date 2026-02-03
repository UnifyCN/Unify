import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSanitySubmoduleWithLessons } from '@/hooks/sanity/useSanitySubmodules';
import { useSanityModuleWithSubmodules } from '@/hooks/sanity/useSanityModules';
import { Feather } from '@expo/vector-icons';
import { cachedProgressService } from '@/services/progress/cachedProgressService';
import { progressClient } from '@/services/progress/progressClient';
import { usePracticeProgress } from '@/hooks/progress/usePracticeProgress';
import { useTaskProgress } from '@/hooks/progress/useTaskProgress';
import { useSanityPractices } from '@/hooks/sanity/useSanityPractices';
import { useSanityTasks } from '@/hooks/sanity/useSanityTasks';
import { getLearnHref } from '@/utils/learnHref';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUBJECT_COLOR = '#10B981'; // green for Learn (active)
const CARD_INACTIVE_BG = '#F9FAFB';
const CARD_INACTIVE_BORDER = '#E5E7EB';
const CARD_INACTIVE_TEXT = '#6B7280';

const TIMELINE_LEFT_WIDTH = 24;
const DOT_SIZE = 16;
const LINE_WIDTH = 2;

type SectionUIState = 'completed' | 'active' | 'unlocked' | 'locked';

interface SubmoduleSectionViewModel {
  id: string;
  title: string;
  description: string;
  progressPercent: number;
  uiState: SectionUIState;
  onPress: () => void;
}

function getSectionStyles(
  section: SubmoduleSectionViewModel,
  prevSection: SubmoduleSectionViewModel | null,
  nextSection: SubmoduleSectionViewModel | null,
  subjectColor: string
): {
  dotStyle: ViewStyle[];
  lineAboveStyle: ViewStyle[];
  lineBelowStyle: ViewStyle[];
} {
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
    dotStyle.push({
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: '#D1D1D1',
    });
  }

  let lineAboveStyle: ViewStyle[] = [styles.lineSegment];
  if (prevSection) {
    if (prevSection.uiState === 'completed' && section.uiState === 'completed') {
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

  let lineBelowStyle: ViewStyle[] = [styles.lineSegment];
  if (nextSection) {
    if (section.uiState === 'completed' && nextSection.uiState === 'completed') {
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
}

export default function SubmoduleIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { moduleId, submoduleId } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
  }>();

  const [learnProgressPercent, setLearnProgressPercent] = useState(0);
  const [practiceProgressPercent, setPracticeProgressPercent] = useState(0);
  const [taskProgressPercent, setTaskProgressPercent] = useState(0);
  const [isResolvingLearnHref, setIsResolvingLearnHref] = useState(false);
  const [openedCardId, setOpenedCardId] = useState<string | null>('learn');

  const {
    data: submoduleData,
    isLoading,
    error,
  } = useSanitySubmoduleWithLessons(submoduleId || '');
  const { data: moduleData } = useSanityModuleWithSubmodules(moduleId || '');
  const { data: practices } = useSanityPractices(submoduleId || '');
  const { data: tasks } = useSanityTasks(submoduleId || '');
  const { getPracticeProgressBySubmodule } = usePracticeProgress();
  const { getTaskProgressBySubmodule } = useTaskProgress();

  const subjectColor = moduleData?.colorTheme?.hex || SUBJECT_COLOR;

  const sectionNumber =
    (moduleData?.submodules?.findIndex(s => s?._id === submoduleId) ?? 0) + 1;

  useFocusEffect(
    useCallback(() => {
      if (!moduleId || !submoduleId) return;
      let cancelled = false;
      cachedProgressService
        .getSubmoduleProgress(moduleId, submoduleId)
        .then(progress => {
          if (!cancelled && progress?.progress_percent != null) {
            const p = Number(progress.progress_percent);
            setLearnProgressPercent(Number.isFinite(p) ? Math.min(100, Math.max(0, p)) : 0);
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [moduleId, submoduleId])
  );

  useFocusEffect(
    useCallback(() => {
      if (!submoduleId) return;
      let cancelled = false;
      const total = practices?.length ?? 0;
      if (total === 0) {
        setPracticeProgressPercent(0);
        return undefined;
      }
      getPracticeProgressBySubmodule(submoduleId).then(rows => {
        if (cancelled) return;
        const completed = (rows || []).filter(r => r.is_completed).length;
        const p = total > 0 ? Math.round((completed / total) * 100) : 0;
        setPracticeProgressPercent(Math.min(100, Math.max(0, p)));
      });
      return () => {
        cancelled = true;
      };
    }, [submoduleId, practices?.length, getPracticeProgressBySubmodule])
  );

  const handleLearnPress = async () => {
    if (!moduleId || !submoduleId || !submoduleData) return;
    setIsResolvingLearnHref(true);
    try {
      let user = null;
      try {
        const userResult = await progressClient.auth.getUser();
        user = userResult?.data?.user ?? null;
      } catch {
        user = null;
      }

      let lessonProgresses: any[] | null = null;
      if (user) {
        try {
          const progressResult = await progressClient
            .from('user_lesson_progress')
            .select(
              'sanity_lesson_id,is_completed,is_in_progress,current_page_type,current_page_number,current_quiz_id,current_question_number'
            )
            .eq('user_id', user.id)
            .eq('sanity_submodule_id', submoduleId);
          lessonProgresses = progressResult?.data ?? null;
        } catch {
          lessonProgresses = null;
        }
      }

      const href = getLearnHref(
        moduleId,
        submoduleId,
        submoduleData,
        lessonProgresses
      );
      if (href) {
        router.push(href as any);
      }
    } finally {
      setIsResolvingLearnHref(false);
    }
  };

  const handleTasksPress = () => {
    if (!moduleId || !submoduleId) return;
    router.push({
      pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/tasks' as any,
      params: { moduleId, submoduleId },
    });
  };

  const handlePracticePress = () => {
    if (!moduleId || !submoduleId) return;
    router.push({
      pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/practice' as any,
      params: { moduleId, submoduleId },
    });
  };

  const sections: SubmoduleSectionViewModel[] = [
    {
      id: 'learn',
      title: 'Learn',
      description: 'Key concepts & terms',
      progressPercent: learnProgressPercent,
      uiState:
        learnProgressPercent >= 100
          ? 'completed'
          : learnProgressPercent > 0
            ? 'active'
            : 'unlocked',
      onPress: handleLearnPress,
    },
    {
      id: 'tasks',
      title: 'Tasks',
      description: 'Real-world steps',
      progressPercent: taskProgressPercent,
      uiState:
        taskProgressPercent >= 100
          ? 'completed'
          : taskProgressPercent > 0
            ? 'active'
            : 'unlocked',
      onPress: handleTasksPress,
    },
    {
      id: 'practice',
      title: 'Practice',
      description: 'Test your understanding',
      progressPercent: practiceProgressPercent,
      uiState:
        practiceProgressPercent >= 100
          ? 'completed'
          : practiceProgressPercent > 0
            ? 'active'
            : 'unlocked',
      onPress: handlePracticePress,
    },
  ];

  const handleCardTap = (section: SubmoduleSectionViewModel) => {
    if (openedCardId === section.id) {
      section.onPress();
    } else {
      setOpenedCardId(section.id);
    }
  };

  const renderSectionCard = (section: SubmoduleSectionViewModel, index: number) => {
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
        <View style={styles.timelineColumn}>
          <View style={styles.timelineContent}>
            <View style={styles.lineHalf}>
              {!isFirst && <View style={[...lineAboveStyle, { flex: 1 }]} />}
            </View>
            <View style={dotStyle} />
            <View style={styles.lineHalf}>
              {!isLast && <View style={[...lineBelowStyle, { flex: 1 }]} />}
            </View>
          </View>
          {!isLast && (
            <View style={styles.timelineGap}>
              <View style={[...lineBelowStyle, { flex: 1 }]} />
            </View>
          )}
        </View>
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
          <View style={styles.cardInner}>
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
                styles.sectionDescription,
                isOpened && styles.lessonCountOpened,
                isLocked && styles.textLocked,
              ]}
            >
              {section.description}
            </Text>
            {isOpened && (
              <View style={styles.progressBarWrap}>
                <View
                  style={[
                    styles.progressBarBg,
                    styles.progressBarBgOpened,
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, section.progressPercent)}%`,
                        backgroundColor: 'rgba(255,255,255,0.4)',
                      },
                    ]}
                  />
                </View>
              </View>
            )}
            {section.id === 'learn' && isResolvingLearnHref && isOpened && (
              <ActivityIndicator size="small" color="#fff" style={styles.cardLoader} />
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={subjectColor} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !submoduleData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            {error?.message || 'Unable to load this section'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.pageContainer}>
      {/* White header: back, icon, title, description */}
      <View
        style={[
          styles.header,
          { backgroundColor: '#FFFFFF', paddingTop: insets.top },
        ]}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() =>
              router.replace({
                pathname: '/(tabs)/Learn/modules/[moduleId]' as any,
                params: { moduleId },
              })
            }
            style={styles.backButton}
          >
            <Feather name="chevron-left" size={28} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenterWrap}>
            <Text style={styles.headerModuleName} numberOfLines={1}>
              {moduleData?.title ?? ''}
            </Text>
          </View>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <View style={styles.headerTitleWrap}>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerSectionLabel}>
              Section {sectionNumber}
            </Text>
            <Text style={styles.headerTitle}>{submoduleData.title}</Text>
          </View>
        </View>

        <View style={styles.headerDescriptionWrap}>
          <Text style={styles.headerDescription}>
            {submoduleData.description
              ? `By the end of this section, you will ${submoduleData.description}`
              : 'Learn key concepts and practice your skills.'}
          </Text>
        </View>
      </View>

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

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative' as const,
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
  headerTitleBlock: {
    marginLeft: 16,
    marginBottom: 10,
  },
  headerSectionLabel: {
    fontSize: 24,
    fontWeight: '400',
    color: '#000',
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  headerDescriptionWrap: {
    paddingHorizontal: 16,
    marginTop: 4,
    paddingBottom: 4,
  },
  headerDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
    opacity: 0.9,
    lineHeight: 20,
    marginLeft: 16,
  },
  headerCenterWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 5,
  },
  headerModuleName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  headerRightPlaceholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingLeft: 16,
    paddingRight: 32,
  },
  sectionRow: {
    flexDirection: 'row',
    minHeight: 70,
    paddingBottom: 24,
  },
  timelineColumn: {
    width: TIMELINE_LEFT_WIDTH,
    alignItems: 'center',
    flexDirection: 'column',
  },
  timelineContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  timelineGap: {
    height: 24,
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: -24,
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
    opacity: 0.4,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginLeft: 16,
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
  cardInner: {
    position: 'relative',
    paddingVertical: 4
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  cardTitleOpened: {
    color: '#FFFFFF',
  },
  sectionDescription: {
    fontSize: 20,
    fontWeight: '500',
    color: '#888888',
  },
  lessonCountOpened: {
    color: 'rgba(255,255,255,0.85)',
  },
  textLocked: {
    color: '#AAAAAA',
  },
  progressBarWrap: {
    marginTop: 8,
  },
  progressBarBg: {
    height: 11,
    borderRadius: 6,
    backgroundColor: '#E5E5E5',
    overflow: 'hidden',
  },
  progressBarBgOpened: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  cardLoader: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
});
