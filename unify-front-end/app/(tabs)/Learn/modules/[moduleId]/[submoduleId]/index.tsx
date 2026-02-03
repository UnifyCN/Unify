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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSanitySubmoduleWithLessons } from '@/hooks/sanity/useSanitySubmodules';
import { useSanityModuleWithSubmodules } from '@/hooks/sanity/useSanityModules';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { cachedProgressService } from '@/services/progress/cachedProgressService';
import { progressClient } from '@/services/progress/progressClient';
import { usePracticeProgress } from '@/hooks/progress/usePracticeProgress';
import { useTaskProgress } from '@/hooks/progress/useTaskProgress';
import { useSanityPractices } from '@/hooks/sanity/useSanityPractices';
import { useSanityTasks } from '@/hooks/sanity/useSanityTasks';
import { getLearnHref } from '@/utils/learnHref';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Blob3 from '@/assets/images/Blob3.svg';
import Blob8 from '@/assets/images/Blob8.svg';
import Blob10 from '@/assets/images/Blob10.svg';
import Blob11 from '@/assets/images/Blob11.svg';
import Blob12 from '@/assets/images/Blob12.svg';

const SUBJECT_COLOR = '#10B981'; // green for Learn (active)

const mapIconName = (iconName: string): string => {
  const iconMap: { [key: string]: string } = {
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
const CARD_INACTIVE_BG = '#F9FAFB';
const CARD_INACTIVE_BORDER = '#E5E7EB';
const CARD_INACTIVE_TEXT = '#6B7280';

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

  const blobIndexNum = sectionNumber % 5;
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
      {/* Colored Header (same as module index) */}
      <View
        style={[
          styles.header,
          { backgroundColor: subjectColor, paddingTop: insets.top },
        ]}
      >
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
            fill="#FFFFFF"
            opacity={0.3}
          />
        </View>
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
            <Feather name="chevron-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {moduleData?.icon ? (
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons
                name={mapIconName(moduleData.icon) as any}
                size={30}
                color="#FFFFFF"
              />
            </View>
          ) : (
            <View style={styles.headerRightPlaceholder} />
          )}
        </View>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>
            Section {sectionNumber}: {submoduleData.title}
          </Text>
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
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Three cards: Learn, Tasks, Practice */}
        <View style={styles.cardsContainer}>
          {/* Learn */}
          <TouchableOpacity
            style={[styles.card, styles.cardLearn, { backgroundColor: subjectColor }]}
            onPress={handleLearnPress}
            disabled={isResolvingLearnHref}
            activeOpacity={0.85}
          >
            <View style={styles.cardLeftLine}>
              <View style={[styles.cardDot, styles.cardDotActive, { borderColor: subjectColor, backgroundColor: '#fff' }]} />
              <View style={[styles.cardLineSegment, { backgroundColor: CARD_INACTIVE_BORDER }]} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitleLearn}>Learn</Text>
              <Text style={styles.cardSubtitleLearn}>Key concepts & terms</Text>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${learnProgressPercent}%`, backgroundColor: 'rgba(0,0,0,0.2)' },
                    ]}
                  />
                </View>
              </View>
            </View>
            {isResolvingLearnHref && (
              <ActivityIndicator size="small" color="#fff" style={styles.cardLoader} />
            )}
          </TouchableOpacity>

          {/* Tasks */}
          <TouchableOpacity
            style={[styles.card, styles.cardInactive]}
            onPress={handleTasksPress}
            activeOpacity={0.8}
          >
            <View style={styles.cardLeftLine}>
              <View style={[styles.cardDot, styles.cardDotInactive]} />
              <View style={[styles.cardLineSegment, styles.cardLineInactive]} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitleInactive}>Tasks</Text>
              <Text style={styles.cardSubtitleInactive}>Real-world steps</Text>
              <View style={styles.progressBarContainerInactive}>
                <View style={styles.progressBarBgInactive}>
                  <View
                    style={[
                      styles.progressBarFillInactive,
                      {
                        width: `${taskProgressPercent}%`,
                        backgroundColor: subjectColor,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Practice */}
          <TouchableOpacity
            style={[styles.card, styles.cardInactive]}
            onPress={handlePracticePress}
            activeOpacity={0.8}
          >
            <View style={styles.cardLeftLine}>
              <View style={[styles.cardDot, styles.cardDotInactive]} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitleInactive}>Practice</Text>
              <Text style={styles.cardSubtitleInactive}>Test your understanding</Text>
              <View style={styles.progressBarContainerInactive}>
                <View style={styles.progressBarBgInactive}>
                  <View
                    style={[
                      styles.progressBarFillInactive,
                      {
                        width: `${practiceProgressPercent}%`,
                        backgroundColor: subjectColor,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    paddingLeft: 16,
  },
  headerDescriptionWrap: {
    paddingHorizontal: 16,
    marginTop: 4,
    paddingBottom: 4,
  },
  headerDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
    marginLeft: 16,
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
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  cardsContainer: {
    gap: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 0,
    marginBottom: 12,
    minHeight: 88,
  },
  cardLearn: {
    paddingLeft: 0,
  },
  cardInactive: {
    backgroundColor: CARD_INACTIVE_BG,
    borderWidth: 1,
    borderColor: CARD_INACTIVE_BORDER,
  },
  cardLeftLine: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  cardDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  cardDotActive: {
    borderWidth: 2,
  },
  cardDotInactive: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: CARD_INACTIVE_BORDER,
  },
  cardLineSegment: {
    width: 2,
    flex: 1,
    minHeight: 24,
    marginTop: 4,
    borderRadius: 1,
  },
  cardLineInactive: {
    backgroundColor: CARD_INACTIVE_BORDER,
  },
  cardContent: {
    flex: 1,
  },
  cardTitleLearn: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  cardSubtitleLearn: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  cardTitleInactive: {
    fontSize: 18,
    fontWeight: '700',
    color: CARD_INACTIVE_TEXT,
    marginBottom: 2,
  },
  cardSubtitleInactive: {
    fontSize: 13,
    color: CARD_INACTIVE_TEXT,
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBarContainerInactive: {
    marginTop: 8,
  },
  progressBarBgInactive: {
    height: 6,
    borderRadius: 3,
    backgroundColor: CARD_INACTIVE_BORDER,
    overflow: 'hidden',
  },
  progressBarFillInactive: {
    height: '100%',
    borderRadius: 3,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardLoader: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
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
