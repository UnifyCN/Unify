import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSanityLesson } from '@/hooks/sanity/useSanityLessons';
import { useSanityModule } from '@/hooks/sanity/useSanityModules';
import { useSanityLessonQuizzes } from '@/hooks/sanity/useSanityQuizzes';
import { useSanitySubmoduleWithLessons } from '@/hooks/sanity/useSanitySubmodules';
import RichTextRenderer from '@/components/sanity/RichTextRenderer';
import SubmoduleProgressBar from '@/components/learn/SubmoduleProgressBar';
import { useAnalytics } from '@/utils/analytics';
import { useFocusEffect } from '@react-navigation/native';
import { SelectionProvider, useSelection } from '@/context/SelectionContext';
import { usePageHighlights, useSaveHighlight, useDeleteHighlight } from '@/hooks/highlights/useHighlights';
import SelectionActionBubble from '@/components/learn/SelectionActionBubble';
import ExplainTermModal from '@/components/learn/ExplainTermModal';

// Progress related imports
import { calculateLessonProgress } from '@/utils/submoduleProgress'; // static
import { useLessonProgress } from '@/hooks/progress/useLessonProgress';

export default function LessonPageScreen() {
  const router = useRouter();
  const { moduleId, submoduleId, lessonId, pageNum } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    lessonId: string;
    pageNum: string;
  }>();
  const { trackScreen, trackLessonPageViewed, trackLessonHighlightCreated, trackLessonHighlightRemoved } = useAnalytics();
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [askAIVisible, setAskAIVisible] = useState(false);
  const [askAITerm, setAskAITerm] = useState('');

  const currentPage = parseInt(pageNum || '1');
  const { data: lesson, isLoading: loadingLesson } = useSanityLesson(
    lessonId || ''
  );
  const { data: moduleData } = useSanityModule(moduleId || '');
  const {
    data: quizzes,
    isLoading: quizzesLoading,
    error: quizzesError,
  } = useSanityLessonQuizzes(lessonId || '');
  const { data: submoduleData } = useSanitySubmoduleWithLessons(
    submoduleId || ''
  );

  // Progress tracking
  const { saveLessonCompletion } = useLessonProgress();

  const currentPageData = lesson?.pages?.[currentPage - 1];
  const totalPages = lesson?.pages?.length || 0;

  // Highlights
  const currentPageKey = currentPageData?._key || `page-${currentPage}`;
  const { data: highlights } = usePageHighlights(lessonId || '', currentPageKey);
  const saveHighlightMutation = useSaveHighlight(lessonId || '', currentPageKey);
  const deleteHighlightMutation = useDeleteHighlight(lessonId || '', currentPageKey);

  // Calculate progress for the progress bar - keep it static/offline
  const progress = calculateLessonProgress(
    submoduleData || null,
    lessonId || '',
    currentPage
  );

  const TRACKING_THROTTLE_MS = 500;
  const lessonTitle = lesson?.title;
  const lastTrackedPageRef = useRef<string>('');
  const lastTrackedRef = useRef<number>(0);

  // Track page view
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const pageKey = `${lessonId}-${currentPage}`;
      // Only track if: all IDs exist, data is loaded, throttle passed, AND this is a different page than last tracked
      if (
        moduleId &&
        submoduleId &&
        lessonId &&
        lessonTitle &&
        now - lastTrackedRef.current > TRACKING_THROTTLE_MS &&
        lastTrackedPageRef.current !== pageKey
      ) {
        trackScreen(
          `Lesson Page: ${lessonTitle} - ${currentPage}/${totalPages}`
        );
        trackLessonPageViewed(
          moduleId,
          submoduleId,
          lessonId,
          currentPage,
          totalPages
        );
        lastTrackedRef.current = now;
        lastTrackedPageRef.current = pageKey;
      }
    }, [
      lessonTitle,
      moduleId,
      submoduleId,
      lessonId,
      currentPage,
      totalPages,
      trackScreen,
      trackLessonPageViewed,
    ])
  );

  // Helper functions for sequential navigation
  const getCurrentLessonIndex = () => {
    if (!submoduleData?.lessons) return -1;
    return submoduleData.lessons.findIndex(l => l._id === lessonId);
  };

  const getNextLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex === -1 || !submoduleData?.lessons) return null;
    return submoduleData.lessons[currentIndex + 1] || null;
  };

  const getPreviousLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex === -1 || !submoduleData?.lessons) return null;
    return submoduleData.lessons[currentIndex - 1] || null;
  };

  const isFirstLesson = () => getCurrentLessonIndex() === 0;
  const isLastLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    return currentIndex === (submoduleData?.lessons?.length || 0) - 1;
  };

  const handleSaveAndLeave = () => {
    setShowExitModal(false);
    router.push({
      pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]' as any,
      params: { moduleId, submoduleId },
    });
  };

  const handleContinue = () => {
    setShowExitModal(false);
  };

  const handleNext = async () => {
    if (currentPage < totalPages) {
      // Go to next page
      router.push({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/pages/[pageNum]' as any,
        params: {
          moduleId,
          submoduleId,
          lessonId,
          pageNum: (currentPage + 1).toString(),
        },
      });
    } else {
      // All lesson pages completed, check if there are activity pages
      const totalActivityPages = lesson?.activity_pages?.length || 0;
      if (totalActivityPages > 0) {
        // Navigate to first activity page
        router.push({
          pathname:
            '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/activities/[pageNum]' as any,
          params: { moduleId, submoduleId, lessonId, pageNum: '1' },
        });
      } else {
        // No activity pages, check if there are quizzes
        if (quizzes && quizzes.length > 0) {
          // Navigate to first quiz (sorted by order_number)
          const sortedQuizzes = quizzes.sort(
            (a, b) => a.order_number - b.order_number
          );
          const firstQuiz = sortedQuizzes[0];
          router.push({
            pathname:
              '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/quizzes/[quizId]' as any,
            params: { moduleId, submoduleId, lessonId, quizId: firstQuiz._id },
          });
        } else {
          // No quizzes, check if there are ending pages
          const totalEndingPages = lesson?.ending_pages?.length || 0;
          if (totalEndingPages > 0) {
            // Navigate to first ending page
            router.push({
              pathname:
                '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/ending/[pageNum]' as any,
              params: { moduleId, submoduleId, lessonId, pageNum: '1' },
            });
          } else {
            // No ending pages, save this lesson as completed (in background)
            setIsSaving(true);

            // Save in background - don't block navigation
            saveLessonCompletion(
              lessonId || '',
              submoduleId || '',
              moduleId || '',
              totalPages
            ).finally(() => {
              setIsSaving(false);
            });

            // Navigate immediately
            // Check if this is the last lesson
            if (isLastLesson()) {
              router.push({
                pathname:
                  '/(tabs)/Learn/modules/[moduleId]/[submoduleId]' as any,
                params: { moduleId, submoduleId },
              });
            } else {
              // Go to next lesson
              const nextLesson = getNextLesson();
              if (nextLesson) {
                router.push({
                  pathname:
                    '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/pages/[pageNum]' as any,
                  params: {
                    moduleId,
                    submoduleId,
                    lessonId: nextLesson._id,
                    pageNum: '1',
                  },
                });
              }
            }
          }
        }
      }
    }
  };

  const handleBack = async () => {
    if (currentPage > 1) {
      // Go to previous page
      router.push({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/pages/[pageNum]' as any,
        params: {
          moduleId,
          submoduleId,
          lessonId,
          pageNum: (currentPage - 1).toString(),
        },
      });
    } else {
      // First page, go to previous lesson or map
      const previousLesson = getPreviousLesson();
      if (previousLesson) {
        // Get the last page of the previous lesson
        router.push({
          pathname:
            '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/pages/[pageNum]' as any,
          params: {
            moduleId,
            submoduleId,
            lessonId: previousLesson._id,
            pageNum: '1',
          },
        });
      } else {
        router.push({
          pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]' as any,
          params: { moduleId, submoduleId },
        });
      }
    }
  };

  if (loadingLesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson || !currentPageData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>Error loading lesson page</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SelectionProvider>
      <SafeAreaView style={styles.safe}>
        {/* Progress Bar */}
        <SubmoduleProgressBar
          currentProgress={progress.currentPage}
          totalPages={progress.totalPages}
          submoduleTitle={submoduleData?.title || 'Submodule'}
          submoduleOrder={submoduleData?.order || 1}
          onClose={() => setShowExitModal(true)}
        />

        <LessonPageContent
          currentPageData={currentPageData}
          highlights={highlights || []}
          lessonId={lessonId || ''}
          lessonTitle={lesson?.title}
          saveHighlightMutation={saveHighlightMutation}
          deleteHighlightMutation={deleteHighlightMutation}
          trackLessonHighlightCreated={trackLessonHighlightCreated}
          trackLessonHighlightRemoved={trackLessonHighlightRemoved}
          askAIVisible={askAIVisible}
          setAskAIVisible={setAskAIVisible}
          askAITerm={askAITerm}
          setAskAITerm={setAskAITerm}
        />

        {/* Navigation buttons - anchored at bottom */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextBtn,
              { backgroundColor: moduleData?.colorTheme?.hex || '#575757' },
              isSaving && styles.nextBtnDisabled,
            ]}
            onPress={handleNext}
            disabled={isSaving}
          >
            <Text style={styles.nextBtnText}>Next</Text>
          </TouchableOpacity>
        </View>

        {/* Exit modal, make this into component after in refactoring*/}

        <Modal
          visible={showExitModal}
          transparent
          animationType='fade'
          onRequestClose={() => setShowExitModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Take a break from this lesson?
              </Text>
              <Text style={styles.modalDesc}>
                No worries, your progress will be saved!{'\n'}
                You can pick up right where you left off.
              </Text>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={handleSaveAndLeave}
              >
                <Text style={styles.modalPrimaryBtnText}>
                  Save progress & leave
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={handleContinue}
              >
                <Text style={styles.modalSecondaryBtnText}>Continue Lesson</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SelectionProvider>
  );
}

/**
 * Inner component that uses SelectionContext for highlight/Ask AI actions.
 * Must be rendered inside SelectionProvider.
 */
function LessonPageContent({
  currentPageData,
  highlights,
  lessonId,
  lessonTitle,
  saveHighlightMutation,
  deleteHighlightMutation,
  trackLessonHighlightCreated,
  trackLessonHighlightRemoved,
  askAIVisible,
  setAskAIVisible,
  askAITerm,
  setAskAITerm,
}: {
  currentPageData: any;
  highlights: any[];
  lessonId: string;
  lessonTitle?: string;
  saveHighlightMutation: any;
  deleteHighlightMutation: any;
  trackLessonHighlightCreated: (lessonId: string, text: string) => void;
  trackLessonHighlightRemoved: (lessonId: string) => void;
  askAIVisible: boolean;
  setAskAIVisible: (v: boolean) => void;
  askAITerm: string;
  setAskAITerm: (t: string) => void;
}) {
  const { selection, clearSelection } = useSelection();

  const handleHighlight = useCallback(() => {
    if (!selection.startWord || !selection.endWord) {
      console.warn('[Highlight] No selection start/end word — aborting');
      return;
    }

    const start = Math.min(selection.startWord.wordIndex, selection.endWord.wordIndex);
    const end = Math.max(selection.startWord.wordIndex, selection.endWord.wordIndex);

    console.log('[Highlight] Saving:', {
      blockKey: selection.startWord.blockKey,
      start, end,
      text: selection.selectedText,
      wordsCount: selection.allWords?.length,
    });

    saveHighlightMutation.mutate(
      {
        blockKey: selection.startWord.blockKey,
        startWordIndex: start,
        endWordIndex: end,
        selectedText: selection.selectedText,
        allWordsInBlock: selection.allWords || [],
      },
      {
        onSuccess: (data: any) => console.log('[Highlight] Saved successfully:', data?.id),
        onError: (err: any) => console.error('[Highlight] Save failed:', err?.message || err),
      }
    );

    trackLessonHighlightCreated(lessonId, selection.selectedText);
    clearSelection();
  }, [selection, saveHighlightMutation, lessonId, trackLessonHighlightCreated, clearSelection]);

  const handleRemoveHighlight = useCallback(() => {
    if (!selection.existingHighlight) return;

    deleteHighlightMutation.mutate(selection.existingHighlight.id);
    trackLessonHighlightRemoved(lessonId);
    clearSelection();
  }, [selection, deleteHighlightMutation, lessonId, trackLessonHighlightRemoved, clearSelection]);

  const handleAskAI = useCallback(() => {
    setAskAITerm(selection.selectedText);
    setAskAIVisible(true);
    clearSelection();
  }, [selection, setAskAITerm, setAskAIVisible, clearSelection]);

  const handleScroll = useCallback(() => {
    if (selection.mode !== 'idle') clearSelection();
  }, [selection.mode, clearSelection]);

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={handleScroll}
      >
        {/* Page title */}
        <Text style={styles.pageTitle}>{currentPageData.title}</Text>

        {/* Page contents */}
        <View style={styles.content}>
          <RichTextRenderer
            blocks={currentPageData.content || []}
            markDefs={currentPageData.markDefs}
            styles={{ normal: styles.contentText }}
            highlights={highlights}
          />
        </View>
      </ScrollView>

      {/* Selection action bubble — renders as a Modal overlay */}
      <SelectionActionBubble
        onHighlight={handleHighlight}
        onRemoveHighlight={handleRemoveHighlight}
        onAskAI={handleAskAI}
      />

      {/* Ask AI modal */}
      <ExplainTermModal
        visible={askAIVisible}
        term={askAITerm}
        lessonContext={lessonTitle}
        lessonId={lessonId}
        onClose={() => setAskAIVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { paddingHorizontal: 23, paddingBottom: 100 },

  // Page indicator
  pageIndicatorContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  pageIndicator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },

  pageTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
    lineHeight: 40,
    textAlign: 'center',
    marginTop: 20,
  },

  content: {
    gap: 20,
    marginBottom: 30,
  },
  contentText: {
    fontWeight: 400,
    color: '#424242',
    marginBottom: 15,
    fontSize: 18,
    lineHeight: 27,
  },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Navigation styles
  navigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 23,
    paddingVertical: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    gap: 12,
  },
  backBtn: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  backBtnText: { color: '#374151', fontSize: 16, fontWeight: '600' },
  nextBtn: {
    backgroundColor: '#575757',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  nextBtnDisabled: {
    opacity: 0.7,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalPrimaryBtn: {
    width: '100%',
    backgroundColor: '#575757',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalPrimaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSecondaryBtn: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
