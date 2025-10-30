import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSanityLesson } from '@/hooks/sanity/useSanityLessons';
import { useSanityModule } from '@/hooks/sanity/useSanityModules';
import { useSanitySubmoduleWithLessons } from '@/hooks/sanity/useSanitySubmodules';
import { useSanityLessonQuizzes } from '@/hooks/sanity/useSanityQuizzes';
import RichTextRenderer from '@/components/sanity/RichTextRenderer';
import SubmoduleProgressBar from '@/components/learn/SubmoduleProgressBar';

// Progress related imports
import { calculateEndingProgress } from '@/utils/submoduleProgress';
import { useLessonProgress } from '@/hooks/progress/useLessonProgress';

export default function EndingPageScreen() {
  const router = useRouter();
  const { moduleId, submoduleId, lessonId, pageNum } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    lessonId: string;
    pageNum: string;
  }>();
  const [showExitModal, setShowExitModal] = useState(false);

  const currentPage = parseInt(pageNum || '1');
  const { data: lesson, isLoading: loadingLesson } = useSanityLesson(
    lessonId || ''
  );
  const { data: quizzes } = useSanityLessonQuizzes(lessonId || '');
  const { data: moduleData } = useSanityModule(moduleId || '');
  const { data: submoduleData } = useSanitySubmoduleWithLessons(
    submoduleId || ''
  );

  // Progress tracking
  const { saveLessonCompletion } = useLessonProgress();

  // Sort ending pages by order
  const endingPages = lesson?.ending_pages
    ? [...lesson.ending_pages].sort((a, b) => a.order - b.order)
    : [];
  const currentPageData = endingPages[currentPage - 1];
  const totalPages = endingPages.length;

  // Calculate progress for the progress bar
  const progress = calculateEndingProgress(
    submoduleData || null,
    lessonId || '',
    currentPage
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

  const isLastLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    return currentIndex === (submoduleData?.lessons?.length || 0) - 1;
  };

  const handleSaveAndLeave = () => {
    setShowExitModal(false);
    router.push({
      pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/map' as any,
      params: { moduleId, submoduleId },
    });
  };

  const handleContinue = () => {
    setShowExitModal(false);
  };

  const handleNext = async () => {
    if (currentPage < totalPages) {
      // Go to next ending page
      router.push({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/ending/[pageNum]' as any,
        params: {
          moduleId,
          submoduleId,
          lessonId,
          pageNum: (currentPage + 1).toString(),
        },
      });
    } else {
      // All ending pages completed, save this lesson as completed
      const totalLessonPages = lesson?.pages?.length || 0;
      const totalActivityPages = lesson?.activity_pages?.length || 0;
      const totalQuizPages =
        quizzes?.reduce(
          (acc: number, quiz: any) => acc + (quiz.questions?.length || 0),
          0
        ) || 0;
      const totalEndingPages = endingPages.length;
      const totalAllPages =
        totalLessonPages + totalActivityPages + totalQuizPages + totalEndingPages;

      await saveLessonCompletion(
        lessonId || '',
        submoduleId || '',
        moduleId || '',
        totalAllPages
      );

      // Check if this is the last lesson
      if (isLastLesson()) {
        // Last lesson completed, go back to map
        router.push({
          pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/map' as any,
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
  };

  const handleBack = () => {
    if (currentPage > 1) {
      // Go to previous ending page
      router.push({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/ending/[pageNum]' as any,
        params: {
          moduleId,
          submoduleId,
          lessonId,
          pageNum: (currentPage - 1).toString(),
        },
      });
    } else {
      // First ending page, go back to last quiz
      if (quizzes && quizzes.length > 0) {
        const sortedQuizzes = [...quizzes].sort(
          (a, b) => a.order_number - b.order_number
        );
        const lastQuiz = sortedQuizzes[sortedQuizzes.length - 1];
        const lastQuizQuestions = lastQuiz.questions?.length || 1;
        router.push({
          pathname:
            '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/quizzes/[quizId]/pages/[questionNum]' as any,
          params: {
            moduleId,
            submoduleId,
            lessonId,
            quizId: lastQuiz._id,
            questionNum: lastQuizQuestions.toString(),
          },
        });
      } else if (lesson?.activity_pages && lesson.activity_pages.length > 0) {
        // No quizzes, go back to last activity page
        router.push({
          pathname:
            '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/activities/[pageNum]' as any,
          params: {
            moduleId,
            submoduleId,
            lessonId,
            pageNum: lesson.activity_pages.length.toString(),
          },
        });
      } else {
        // No quizzes or activities, go back to last lesson page
        const totalLessonPages = lesson?.pages?.length || 0;
        if (totalLessonPages > 0) {
          router.push({
            pathname:
              '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/pages/[pageNum]' as any,
            params: {
              moduleId,
              submoduleId,
              lessonId,
              pageNum: totalLessonPages.toString(),
            },
          });
        }
      }
    }
  };

  if (loadingLesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>Loading ending page...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson || !currentPageData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>Error loading ending page</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress Bar */}
      <SubmoduleProgressBar
        currentProgress={progress.currentPage}
        totalPages={progress.totalPages}
        submoduleTitle={submoduleData?.title || 'Submodule'}
        submoduleOrder={submoduleData?.order || 1}
        onClose={() => setShowExitModal(true)}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Page indicator */}
        {totalPages > 1 && (
          <View style={styles.pageIndicatorContainer}>
            <Text style={styles.pageIndicator}>
              {currentPage} of {totalPages}
            </Text>
          </View>
        )}

        {/* Page title */}
        <Text style={styles.pageTitle}>{currentPageData.title}</Text>

        {/* Page contents */}
        <View style={styles.content}>
          <RichTextRenderer
            blocks={currentPageData.content || []}
            markDefs={currentPageData.markDefs}
            styles={{ normal: styles.contentText }}
          />
        </View>
      </ScrollView>

      {/* Navigation buttons - anchored at bottom */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextBtn,
            { backgroundColor: moduleData?.colorTheme?.hex || '#575757' },
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>
            {currentPage < totalPages
              ? 'Next'
              : isLastLesson()
                ? 'Complete'
                : 'Next Lesson'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exit modal */}
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
    fontSize: 14,
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
    fontWeight: 600,
    color: '#424242',
    marginBottom: 15,
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
    paddingBottom: 40,
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
    fontSize: 14,
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

