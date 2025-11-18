import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSanityLesson } from '@/hooks/sanity/useSanityLessons';
import { useSanityModule } from '@/hooks/sanity/useSanityModules';
import { useSanityLessonQuizzes } from '@/hooks/sanity/useSanityQuizzes';
import { useSanitySubmoduleWithLessons } from '@/hooks/sanity/useSanitySubmodules';
import RichTextRenderer from '@/components/sanity/RichTextRenderer';
import SubmoduleProgressBar from '@/components/learn/SubmoduleProgressBar';
import { calculateActivityProgress } from '@/utils/submoduleProgress';
import { useLessonProgress } from '@/hooks/progress/useLessonProgress';

export default function ActivityPageScreen() {
  const router = useRouter();
  const { moduleId, submoduleId, lessonId, pageNum } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    lessonId: string;
    pageNum: string;
  }>();
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [questionAnswers, setQuestionAnswers] = useState<{
    [key: string]: string | string[];
  }>({});
  const [isSaving, setIsSaving] = useState(false);

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

  // Reset state when page changes
  useEffect(() => {
    setIsSubmitted(false);
    setInputValues({});
    setQuestionAnswers({});
  }, [currentPage]);

  // Progress tracking
  const { saveLessonCompletion } = useLessonProgress();
  const currentPageData = lesson?.activity_pages?.[currentPage - 1];
  const totalPages = lesson?.activity_pages?.length || 0;

  // Calculate progress for the progress bar - keep it static/offline
  const progress = calculateActivityProgress(
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

  const getPreviousLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex === -1 || !submoduleData?.lessons) return null;
    return submoduleData.lessons[currentIndex - 1] || null;
  };

  const handleSaveAndLeave = () => {
    setShowExitModal(false);
    // Navigate to submodule map
    router.push({
      pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/map' as any,
      params: { moduleId, submoduleId },
    });
  };

  const handleContinue = () => {
    setShowExitModal(false);
  };

  const handleInputChange = (fieldKey: string, value: string) => {
    setInputValues(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleQuestionAnswer = (questionKey: string, answer: string | string[]) => {
    setQuestionAnswers(prev => ({ ...prev, [questionKey]: answer }));
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
  };

  const handleNext = async () => {
    if (currentPage < totalPages) {
      // Go to next activity page
      router.push({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/activities/[pageNum]' as any,
        params: {
          moduleId,
          submoduleId,
          lessonId,
          pageNum: (currentPage + 1).toString(),
        },
      });
    } else {
      // All activity pages completed, check if there are quizzes
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
          const currentIndex = getCurrentLessonIndex();
          const isLastLesson =
            currentIndex === (submoduleData?.lessons?.length || 0) - 1;

          if (isLastLesson) {
            // Last lesson completed, go back to map
            router.push({
              pathname:
                '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/map' as any,
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
  };

  const handleBack = () => {
    if (currentPage > 1) {
      // Go to previous activity page
      router.push({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/activities/[pageNum]' as any,
        params: {
          moduleId,
          submoduleId,
          lessonId,
          pageNum: (currentPage - 1).toString(),
        },
      });
    } else {
      // First activity page, go back to last lesson page
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
      } else {
        // No lesson pages, go to previous lesson
        const previousLesson = getPreviousLesson();
        if (previousLesson) {
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
          // First lesson, go back to map
          router.push({
            pathname:
              '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/map' as any,
            params: { moduleId, submoduleId },
          });
        }
      }
    }
  };

  if (loadingLesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header />
        <View style={styles.loading}>
          <Text>Loading activity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson || !currentPageData) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header />
        <View style={styles.loading}>
          <Text>Error loading activity page</Text>
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
              Activity {currentPage} of {totalPages}
            </Text>
          </View>
        )}

        {/* Page title */}
        <Text style={styles.pageTitle}>{currentPageData.title}</Text>

        {/* Instructions with embedded input fields and questions */}
        <View style={styles.instructionsContainer}>
          <RichTextRenderer
            blocks={currentPageData.instructions || []}
            markDefs={currentPageData.instructionsMarkDefs}
            inputValues={inputValues}
            onInputChange={handleInputChange}
            questionAnswers={questionAnswers}
            onQuestionAnswer={handleQuestionAnswer}
            showQuestionFeedback={isSubmitted}
          />
        </View>

        {/* Answer box (if available and submitted) */}
        {currentPageData.answer_box && isSubmitted && (
          <View style={styles.answerBoxContainer}>
            {currentPageData.answer_box.title && (
              <Text style={styles.answerBoxTitle}>
                {currentPageData.answer_box.title}
              </Text>
            )}
            <RichTextRenderer
              blocks={currentPageData.answer_box.content || []}
              markDefs={currentPageData.answer_box.markDefs}
              styles={{
                // Regular copy: 14/20, dark gray
                normal: {
                  fontSize: 14,
                  lineHeight: 20,
                  fontWeight: '400',
                  color: '#3F3F3F',
                  marginBottom: 0,
                },
                bullet: {
                  fontSize: 14,
                  lineHeight: 20,
                  fontWeight: '400',
                  color: '#3F3F3F',
                  marginBottom: 0,
                },
                number: {
                  fontSize: 14,
                  lineHeight: 20,
                  fontWeight: '400',
                  color: '#3F3F3F',
                  marginBottom: 0,
                },
                // Bold lead-in like **Nice work!**
                strong: {
                  fontSize: 14,
                  lineHeight: 20,
                  fontWeight: '600',
                  color: '#3F3F3F',
                },
              }}
            />
          </View>
        )}
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
            isSaving && styles.nextBtnDisabled,
          ]}
          onPress={isSubmitted ? handleNext : handleSubmit}
          disabled={isSaving}
        >
          <Text style={styles.nextBtnText}>
            {!isSubmitted
              ? 'Submit'
              : currentPage < totalPages
                ? 'Next'
                : quizzes && quizzes.length > 0
                  ? `Take Quiz`
                  : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
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
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
    lineHeight: 38,
    textAlign: 'center',
    marginTop: 20,
  },

  instructionsContainer: {
    marginBottom: 15,
  },

  inputFieldsContainer: {
    marginBottom: 30,
    gap: 20,
  },

  inputFieldContainer: {
    gap: 8,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },

  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },

  largeInput: {
    minHeight: 100,
    height: 300,
    textAlignVertical: 'top',
  },

  midInput: {
    height: 60,
  },

  smallInput: {
    height: 44,
  },

  answerBoxContainer: {
    backgroundColor: 'transparent', // ← no filled background
    borderLeftWidth: 5,
    borderLeftColor: '#3F3F3F',
    paddingLeft: 15, // Figma
    paddingRight: 0,
    paddingVertical: 0,
    alignSelf: 'center',
    width: 353, // Figma width
    maxWidth: '100%',
    minHeight: 80, // Figma baseline, still grows with content
    marginTop: 0,
    marginBottom: 30,
  },

  // If you keep a separate title (not typical for this tip style):
  answerBoxTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#3F3F3F',
    marginBottom: 10,
  },

  answerBoxText: {
    // Regular 14 / 20 for paragraph text inside renderer
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: '#F5F5F5',
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  nextBtnDisabled: {
    opacity: 0.7,
  },
});
