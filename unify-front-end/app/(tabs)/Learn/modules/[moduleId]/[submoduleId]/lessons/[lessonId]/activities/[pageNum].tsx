import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
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
import { calculateActivityProgress } from '@/utils/submoduleProgress';

export default function ActivityPageScreen() {
  const router = useRouter();
  const { moduleId, submoduleId, lessonId, pageNum } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    lessonId: string;
    pageNum: string;
  }>();
  const [showExitModal, setShowExitModal] = useState(false);
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentPage = parseInt(pageNum || '1');
  const { data: lesson, isLoading: loadingLesson } = useSanityLesson(lessonId || '');
  const { data: moduleData } = useSanityModule(moduleId || '');
  const { data: quizzes, isLoading: quizzesLoading, error: quizzesError } = useSanityLessonQuizzes(lessonId || '');
  const { data: submoduleData } = useSanitySubmoduleWithLessons(submoduleId || '');

  const currentPageData = lesson?.activity_pages?.[currentPage - 1];
  const totalPages = lesson?.activity_pages?.length || 0;

  // Calculate progress for the progress bar
  const progress = calculateActivityProgress(submoduleData || null, lessonId || '', currentPage);

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

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      // Go to next activity page
      router.push({
        pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/activities/[pageNum]' as any,
        params: { moduleId, submoduleId, lessonId, pageNum: (currentPage + 1).toString() },
      });
    } else {
      // All activity pages completed, check if there are quizzes
      if (quizzes && quizzes.length > 0) {
        // Navigate to first quiz (sorted by order_number)
        const sortedQuizzes = quizzes.sort((a, b) => a.order_number - b.order_number);
        const firstQuiz = sortedQuizzes[0];
        router.push({
          pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/quizzes/[quizId]' as any,
          params: { moduleId, submoduleId, lessonId, quizId: firstQuiz._id },
        });
      } else {
        // No quizzes, go to next lesson or back to map if last lesson
        const nextLesson = getNextLesson();
        if (nextLesson) {
          router.push({
            pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/pages/[pageNum]' as any,
            params: { moduleId, submoduleId, lessonId: nextLesson._id, pageNum: '1' },
          });
        } else {
          // Last lesson completed, go back to map
          router.push({
            pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/map' as any,
            params: { moduleId, submoduleId },
          });
        }
      }
    }
  };

  const handleBack = () => {
    if (currentPage > 1) {
      // Go to previous activity page
      router.push({
        pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/activities/[pageNum]' as any,
        params: { moduleId, submoduleId, lessonId, pageNum: (currentPage - 1).toString() },
      });
    } else {
      // First activity page, go back to last lesson page
      const totalLessonPages = lesson?.pages?.length || 0;
      if (totalLessonPages > 0) {
        router.push({
          pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/pages/[pageNum]' as any,
          params: { moduleId, submoduleId, lessonId, pageNum: totalLessonPages.toString() },
        });
      } else {
        // No lesson pages, go to previous lesson
        const previousLesson = getPreviousLesson();
        if (previousLesson) {
          router.push({
            pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/pages/[pageNum]' as any,
            params: { moduleId, submoduleId, lessonId: previousLesson._id, pageNum: '1' },
          });
        } else {
          // First lesson, go back to map
          router.push({
            pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/map' as any,
            params: { moduleId, submoduleId },
          });
        }
      }
    }
  };

  if (loadingLesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>Loading activity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson || !currentPageData) {
    return (
      <SafeAreaView style={styles.safe}>
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

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <RichTextRenderer blocks={currentPageData.instructions || []} />
        </View>

        {/* Input fields */}
        {currentPageData.input_fields && currentPageData.input_fields.length > 0 && (
          <View style={styles.inputFieldsContainer}>
            {currentPageData.input_fields.map((field) => {
              const isLarge = field._type === 'large_input_box';
              const isMid = field._type === 'mid_input_box';
              const isSmall = field._type === 'small_input_box';
              
              return (
                <View key={field._key} style={styles.inputFieldContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      isLarge && styles.largeInput,
                      isMid && styles.midInput,
                      isSmall && styles.smallInput,
                    ]}
                    placeholder={field.placeholder}
                    value={inputValues[field._key] || ''}
                    onChangeText={(value) => handleInputChange(field._key, value)}
                    multiline={isLarge}
                    numberOfLines={isLarge ? 4 : 1}                    
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* Answer box (if available and submitted) */}
        {currentPageData.answer_box && isSubmitted && (
          <View style={styles.answerBoxContainer}>
            {currentPageData.answer_box.title && (
              <Text style={styles.answerBoxTitle}>{currentPageData.answer_box.title}</Text>
            )}
            <RichTextRenderer blocks={currentPageData.answer_box.content || []} />
          </View>
        )}

        {/* Navigation buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.nextBtn} 
            onPress={isSubmitted ? handleNext : handleSubmit}
          >
            <Text style={styles.nextBtnText}>
              {!isSubmitted 
                ? 'Submit'
                : currentPage < totalPages 
                  ? 'Next Activity' 
                  : quizzes && quizzes.length > 0 
                    ? `Take Quiz` 
                    : 'Complete Lesson'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { paddingHorizontal: 20, paddingBottom: 40 },

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
    backgroundColor: '#F3F4F6',
    padding: 16,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#4B5563',
    marginLeft: 0,
  },

  answerBoxTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Navigation styles
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
});
