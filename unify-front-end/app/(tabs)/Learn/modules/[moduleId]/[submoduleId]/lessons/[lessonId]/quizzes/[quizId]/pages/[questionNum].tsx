import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSanityQuizQuestions } from '@/hooks/sanity/useSanityQuizzes';
import { useSanitySubmoduleWithLessons } from '@/hooks/sanity/useSanitySubmodules';
import { useSanityLessonQuizzes } from '@/hooks/sanity/useSanityQuizzes';
import { useSanityLesson } from '@/hooks/sanity/useSanityLessons';
import { useSanityModule } from '@/hooks/sanity/useSanityModules';
import RichTextRenderer from '@/components/sanity/RichTextRenderer';
import SubmoduleProgressBar from '@/components/learn/SubmoduleProgressBar';
import { calculateQuizProgress } from '@/utils/submoduleProgress';
import { useLessonProgress } from '@/hooks/progress/useLessonProgress';

export default function QuizQuestionPage() {
  const { moduleId, submoduleId, lessonId, quizId, questionNum } =
    useLocalSearchParams<{
      moduleId: string;
      submoduleId: string;
      lessonId: string;
      quizId: string;
      questionNum: string;
    }>();

  const currentQuestionIndex = parseInt(questionNum || '1') - 1;
  const { data: questions, isLoading, error } = useSanityQuizQuestions(quizId);
  const { data: quizzes } = useSanityLessonQuizzes(lessonId);
  const { data: lesson } = useSanityLesson(lessonId || '');
  const { data: submoduleData } = useSanitySubmoduleWithLessons(submoduleId);
  const { data: moduleData } = useSanityModule(moduleId || '');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Matching question state
  const [selectedLeftItem, setSelectedLeftItem] = useState<string | null>(null);
  const [selectedRightItem, setSelectedRightItem] = useState<string | null>(
    null
  );
  const [matchedPairs, setMatchedPairs] = useState<{ [key: string]: string }>(
    {}
  );
  const [completedPairs, setCompletedPairs] = useState<string[]>([]);
  const [incorrectPairs, setIncorrectPairs] = useState<string[]>([]);

  // Progress tracking
  const { saveLessonCompletion } = useLessonProgress();

  // Reset selections when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setSelectedAnswers([]);
    setHasSubmitted(false);
    setIsCorrect(false);
    setSelectedLeftItem(null);
    setSelectedRightItem(null);
    setMatchedPairs({});
    setCompletedPairs([]);
    setIncorrectPairs([]);
  }, [currentQuestionIndex]);

  // Calculate progress for the progress bar
  const progress = calculateQuizProgress(
    submoduleData || null,
    lessonId || '',
    quizId || '',
    currentQuestionIndex + 1
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading question...</Text>
      </View>
    );
  }

  if (error || !questions) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading question</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Get current quiz data
  const currentQuiz = quizzes?.find(q => q._id === quizId);

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

  // Helper function to calculate total pages for a lesson
  const calculateTotalLessonPages = () => {
    const totalLessonPages = lesson?.pages?.length || 0;
    const totalActivityPages = lesson?.activity_pages?.length || 0;
    // Calculate total quiz questions from all quizzes
    const totalQuizPages =
      quizzes?.reduce((acc, quiz) => {
        // Note: quizzes from useSanityLessonQuizzes might not have questions embedded
        // We approximate by using the current quiz's question count * number of quizzes
        // This is an approximation, a better solution would fetch full quiz data
        return acc + (quiz.questions?.length || 0);
      }, 0) || 0;
    const totalEndingPages = lesson?.ending_pages?.length || 0;
    return (
      totalLessonPages + totalActivityPages + totalQuizPages + totalEndingPages
    );
  };

  if (!currentQuestion) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Question not found</Text>
      </View>
    );
  }

  const handleAnswerSelect = (optionId: string) => {
    if (currentQuestion.question_type === 'multiple_choice_multiple') {
      // Multiple selection logic
      setSelectedAnswers(prev => {
        if (prev.includes(optionId)) {
          // Remove if already selected
          return prev.filter(id => id !== optionId);
        } else {
          // Add if not selected
          return [...prev, optionId];
        }
      });
    } else {
      // Single selection logic
      setSelectedAnswer(optionId);
    }
  };

  // Matching question handlers
  const handleMatchingItemSelect = (item: string, side: 'left' | 'right') => {
    if (completedPairs.includes(item)) return; // Don't allow selection of completed items

    // Clear incorrect pairs when user selects any new card
    setIncorrectPairs([]);

    if (side === 'left') {
      if (selectedLeftItem === item) {
        setSelectedLeftItem(null);
      } else {
        setSelectedLeftItem(item);
        // Don't clear right selection - allow both to be selected
      }
    } else {
      if (selectedRightItem === item) {
        setSelectedRightItem(null);
      } else {
        setSelectedRightItem(item);
        // Don't clear left selection - allow both to be selected
      }
    }
  };

  const handleMatchingCheck = () => {
    if (!selectedLeftItem || !selectedRightItem) return;

    // Check if this is a correct match
    const correctMatch = currentQuestion.matching_pairs?.find(
      (pair: any) =>
        pair.left_item === selectedLeftItem &&
        pair.right_item === selectedRightItem
    );

    if (correctMatch) {
      // Correct match - add to completed pairs
      setCompletedPairs(prev => [...prev, selectedLeftItem, selectedRightItem]);
      setMatchedPairs(prev => ({
        ...prev,
        [selectedLeftItem]: selectedRightItem,
      }));
      // Remove from incorrect pairs if it was there
      setIncorrectPairs(prev =>
        prev.filter(
          item => item !== selectedLeftItem && item !== selectedRightItem
        )
      );
    } else {
      // Incorrect match - add to incorrect pairs for red border feedback
      setIncorrectPairs(prev => [...prev, selectedLeftItem, selectedRightItem]);
    }

    // Clear selections
    setSelectedLeftItem(null);
    setSelectedRightItem(null);
  };

  const handleNext = async () => {
    if (currentQuestion.question_type === 'matching') {
      // For matching questions, go directly to next question since all pairs are completed
      // No need for submission logic - proceed to navigation
      if (isLastQuestion) {
        // Quiz completed, check if there are more quizzes or go to next lesson
        const sortedQuizzes =
          quizzes?.sort((a, b) => a.order_number - b.order_number) || [];
        const currentQuizIndex = sortedQuizzes.findIndex(q => q._id === quizId);
        const nextQuiz = sortedQuizzes[currentQuizIndex + 1];

        if (nextQuiz) {
          // Go to next quiz
          router.push({
            pathname:
              '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/quizzes/[quizId]/pages/[questionNum]' as any,
            params: {
              moduleId,
              submoduleId,
              lessonId,
              quizId: nextQuiz._id,
              questionNum: '1',
            },
          });
        } else {
          // All quizzes completed, check if there are ending pages
          const totalEndingPages = lesson?.ending_pages?.length || 0;
          if (totalEndingPages > 0) {
            // Navigate to first ending page
            router.push({
              pathname:
                '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/ending/[pageNum]' as any,
              params: { moduleId, submoduleId, lessonId, pageNum: '1' },
            });
          } else {
            // No ending pages, save this lesson as completed
            const totalPages = calculateTotalLessonPages();
            await saveLessonCompletion(
              lessonId || '',
              submoduleId || '',
              moduleId || '',
              totalPages
            );

            // Check if this is the last lesson
            const currentIndex = getCurrentLessonIndex();
            const isLastLesson =
              currentIndex === (submoduleData?.lessons?.length || 0) - 1;

            if (isLastLesson) {
              // Last lesson completed, go back to module page
              router.push({
                pathname: '/(tabs)/Learn/modules/[moduleId]' as any,
                params: { moduleId },
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
      } else {
        // Go to next question in same quiz
        router.push({
          pathname:
            '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/quizzes/[quizId]/pages/[questionNum]' as any,
          params: {
            moduleId,
            submoduleId,
            lessonId,
            quizId,
            questionNum: (currentQuestionIndex + 2).toString(),
          },
        });
      }
    } else if (!hasSubmitted) {
      // First submission - check if answer is correct
      let isAnswerCorrect = false;

      if (currentQuestion.question_type === 'multiple_choice_multiple') {
        // For multiple choice multiple, check if all correct options are selected and no incorrect ones
        const correctOptions =
          currentQuestion.options?.filter((opt: any) => opt.is_correct) || [];
        const correctOptionIds = correctOptions.map((opt: any) => opt._key);

        // Check if all correct options are selected and no incorrect ones
        const hasAllCorrect = correctOptionIds.every((id: string) =>
          selectedAnswers.includes(id)
        );
        const hasNoIncorrect = selectedAnswers.every((id: string) =>
          correctOptionIds.includes(id)
        );

        isAnswerCorrect =
          hasAllCorrect && hasNoIncorrect && selectedAnswers.length > 0;
      } else {
        // Single choice logic
        const correctAnswerId =
          currentQuestion.correct_answer?.value?.[0] ||
          currentQuestion.correct_answer?.value;
        isAnswerCorrect =
          selectedAnswer === correctAnswerId ||
          currentQuestion.options?.find(
            (opt: any) => opt._key === selectedAnswer
          )?.is_correct;
      }

      setIsCorrect(isAnswerCorrect);
      setHasSubmitted(true);
    } else {
      // Already submitted and correct - proceed to next
      if (isLastQuestion) {
        // Quiz completed, check if there are more quizzes or go to next lesson
        const sortedQuizzes =
          quizzes?.sort((a, b) => a.order_number - b.order_number) || [];
        const currentQuizIndex = sortedQuizzes.findIndex(q => q._id === quizId);
        const nextQuiz = sortedQuizzes[currentQuizIndex + 1];

        if (nextQuiz) {
          // Go to next quiz
          router.push({
            pathname:
              '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/quizzes/[quizId]/pages/[questionNum]' as any,
            params: {
              moduleId,
              submoduleId,
              lessonId,
              quizId: nextQuiz._id,
              questionNum: '1',
            },
          });
        } else {
          // All quizzes completed, check if there are ending pages
          const totalEndingPages = lesson?.ending_pages?.length || 0;
          if (totalEndingPages > 0) {
            // Navigate to first ending page
            router.push({
              pathname:
                '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/ending/[pageNum]' as any,
              params: { moduleId, submoduleId, lessonId, pageNum: '1' },
            });
          } else {
            // No ending pages, save this lesson as completed
            const totalPages = calculateTotalLessonPages();
            await saveLessonCompletion(
              lessonId || '',
              submoduleId || '',
              moduleId || '',
              totalPages
            );

            // Check if this is the last lesson
            const currentIndex = getCurrentLessonIndex();
            const isLastLesson =
              currentIndex === (submoduleData?.lessons?.length || 0) - 1;

            if (isLastLesson) {
              // Last lesson completed, go back to module page
              router.push({
                pathname: '/(tabs)/Learn/modules/[moduleId]' as any,
                params: { moduleId },
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
      } else {
        // Go to next question
        router.push({
          pathname:
            '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/quizzes/[quizId]/pages/[questionNum]' as any,
          params: {
            moduleId,
            submoduleId,
            lessonId,
            quizId,
            questionNum: (currentQuestionIndex + 2).toString(),
          },
        });
      }
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      // Go to previous question
      router.push({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/quizzes/[quizId]/pages/[questionNum]' as any,
        params: {
          moduleId,
          submoduleId,
          lessonId,
          quizId,
          questionNum: currentQuestionIndex.toString(),
        },
      });
    } else {
      // First question, go back to lesson
      router.push({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/pages/[pageNum]' as any,
        params: { moduleId, submoduleId, lessonId, pageNum: '1' },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <SubmoduleProgressBar
        currentProgress={progress.currentPage}
        totalPages={progress.totalPages}
        submoduleTitle={submoduleData?.title || 'Submodule'}
        submoduleOrder={submoduleData?.order || 1}
        onClose={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Question counter */}
        <View style={styles.questionCounterContainer}>
          <Text style={styles.questionCounter}>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Text>
        </View>

        {/* Question Content */}
        <View style={styles.content}>
          {/* Quiz Title */}
          {currentQuiz?.title && (
            <Text style={styles.quizTitle}>{currentQuiz.title}</Text>
          )}

          <View style={styles.questionContainer}>
            <View style={styles.questionContent}>
              <RichTextRenderer
                blocks={currentQuestion.question_text || []}
                markDefs={currentQuestion.questionMarkDefs}
                styles={{
                  normal: {
                    fontSize: 17,
                    color: '#000',
                    lineHeight: 30,
                    textAlign: 'center',
                  },
                }}
              />
            </View>

            {currentQuestion.question_type === 'matching' ? (
              <View style={styles.matchingContainer}>
                <View style={styles.matchingGrid}>
                  {/* Left Column */}
                  <View style={styles.matchingColumn}>
                    {currentQuestion.matching_pairs?.map(
                      (pair: any, index: number) => (
                        <TouchableOpacity
                          key={`left-${index}`}
                          style={[
                            styles.matchingItem,
                            selectedLeftItem === pair.left_item &&
                              styles.matchingItemSelected,
                            completedPairs.includes(pair.left_item) &&
                              styles.matchingItemCompleted,
                            incorrectPairs.includes(pair.left_item) &&
                              styles.matchingItemIncorrect,
                          ]}
                          onPress={() =>
                            handleMatchingItemSelect(pair.left_item, 'left')
                          }
                          disabled={completedPairs.includes(pair.left_item)}
                        >
                          <Text style={styles.matchingItemText}>
                            {pair.left_item}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>

                  {/* Right Column */}
                  <View style={styles.matchingColumn}>
                    {currentQuestion.matching_pairs?.map(
                      (pair: any, index: number) => (
                        <TouchableOpacity
                          key={`right-${index}`}
                          style={[
                            styles.matchingItem,
                            selectedRightItem === pair.right_item &&
                              styles.matchingItemSelected,
                            completedPairs.includes(pair.right_item) &&
                              styles.matchingItemCompleted,
                            incorrectPairs.includes(pair.right_item) &&
                              styles.matchingItemIncorrect,
                          ]}
                          onPress={() =>
                            handleMatchingItemSelect(pair.right_item, 'right')
                          }
                          disabled={completedPairs.includes(pair.right_item)}
                        >
                          <Text style={styles.matchingItemText}>
                            {pair.right_item}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>

                {/* Check Button for Matching */}
                <TouchableOpacity
                  style={[
                    styles.matchingCheckButton,
                    (!selectedLeftItem || !selectedRightItem) &&
                      styles.matchingCheckButtonDisabled,
                  ]}
                  onPress={handleMatchingCheck}
                  disabled={!selectedLeftItem || !selectedRightItem}
                >
                  <Text
                    style={[
                      styles.matchingCheckButtonText,
                      (!selectedLeftItem || !selectedRightItem) &&
                        styles.matchingCheckButtonTextDisabled,
                    ]}
                  >
                    Check
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.optionsContainer}>
                {(currentQuestion.options || []).map((option: any) => {
                  const correctAnswerId =
                    currentQuestion.correct_answer?.value?.[0] ||
                    currentQuestion.correct_answer?.value;
                  const isSelected =
                    currentQuestion.question_type === 'multiple_choice_multiple'
                      ? selectedAnswers.includes(option._key)
                      : selectedAnswer === option._key;
                  const isCorrectOption =
                    option.is_correct || option._key === correctAnswerId;
                  const showFeedback = hasSubmitted;

                  let optionStyle = styles.optionButton;
                  let checkboxStyle = styles.checkbox;

                  // Normal selection behavior
                  if (isSelected) {
                    optionStyle = styles.optionButtonSelected;
                    checkboxStyle = styles.checkboxSelected;
                  }

                  // Add color feedback after check
                  if (showFeedback) {
                    if (isCorrectOption) {
                      // Correct answer - green border
                      optionStyle = styles.optionButtonCorrect;
                      checkboxStyle = styles.checkboxCorrect;
                    } else if (isSelected && !isCorrectOption) {
                      // Wrong selected answer - red border
                      optionStyle = styles.optionButtonIncorrect;
                      checkboxStyle = styles.checkboxIncorrect;
                    }
                  }

                  return (
                    <TouchableOpacity
                      key={option._key}
                      style={optionStyle}
                      onPress={() =>
                        !showFeedback && handleAnswerSelect(option._key)
                      }
                      disabled={showFeedback}
                    >
                      <View style={styles.optionRow}>
                        <View style={checkboxStyle}>
                          {isSelected && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                        <View style={styles.optionContent}>
                          <RichTextRenderer
                            blocks={option.text || []}
                            markDefs={option.textMarkDefs}
                            styles={{ normal: styles.optionText }}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Answer box (if available and submitted) */}
          {currentQuestion.answer_box &&
            hasSubmitted &&
            currentQuestion.answer_box.showAfterSubmit && (
              <View style={styles.answerBoxContainer}>
                <RichTextRenderer
                  blocks={currentQuestion.answer_box.content || []}
                  markDefs={currentQuestion.answer_box.markDefs}
                  styles={{
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
        </View>
      </ScrollView>

      {/* Footer Buttons - anchored at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.checkButton,
            {
              backgroundColor: (
                currentQuestion.question_type === 'matching'
                  ? completedPairs.length !==
                    (currentQuestion.matching_pairs?.length || 0) * 2
                  : currentQuestion.question_type === 'multiple_choice_multiple'
                    ? selectedAnswers.length === 0
                    : !selectedAnswer
              )
                ? '#F3F4F6'
                : moduleData?.colorTheme?.hex || '#575757',
            },
          ]}
          onPress={handleNext}
          disabled={
            currentQuestion.question_type === 'matching'
              ? completedPairs.length !==
                (currentQuestion.matching_pairs?.length || 0) * 2
              : currentQuestion.question_type === 'multiple_choice_multiple'
                ? selectedAnswers.length === 0
                : !selectedAnswer
          }
        >
          <Text
            style={[
              styles.checkButtonText,
              (currentQuestion.question_type === 'matching'
                ? completedPairs.length !==
                  (currentQuestion.matching_pairs?.length || 0) * 2
                : currentQuestion.question_type === 'multiple_choice_multiple'
                  ? selectedAnswers.length === 0
                  : !selectedAnswer) && styles.checkButtonTextDisabled,
            ]}
          >
            {currentQuestion.question_type === 'matching'
              ? 'Next'
              : !hasSubmitted
                ? 'Check'
                : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  closeButton: {
    fontSize: 18,
    color: '#000',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginRight: 18, // Compensate for close button width
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 2,
  },
  questionCounterContainer: {
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  questionCounter: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  content: {
    padding: 20,
    flex: 1,
  },
  quizTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    lineHeight: 38,
    textAlign: 'center',
  },
  questionContainer: {
    gap: 15,
  },
  questionContent: {
    marginBottom: 24,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 25,
    color: '#000',
    lineHeight: 30,
  },
  optionsContainer: {
    gap: 17,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  optionButtonSelected: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#F3F4F6',
  },
  optionButtonCorrect: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderColor: '#10B981',
    backgroundColor: '#F3F4F6',
  },
  optionButtonIncorrect: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderColor: '#EF4444',
    backgroundColor: '#F3F4F6',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  checkboxSelected: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 4,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCorrect: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  checkboxIncorrect: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#EF4444',
    backgroundColor: '#EF4444',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    gap: 12,
  },
  backButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 70,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  checkButton: {
    backgroundColor: '#575757',
    paddingVertical: 14,
    paddingHorizontal: 70,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  checkButtonTextDisabled: {
    color: '#9CA3AF',
  },
  boldText: {
    fontWeight: '700',
  },
  italicText: {
    fontStyle: 'italic',
  },

  // Matching question styles
  matchingContainer: {
    marginTop: 20,
  },
  matchingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  matchingColumn: {
    flex: 1,
    gap: 12,
  },
  matchingItem: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#DCDCDC',
    borderRadius: 8,
    padding: 16,
    minWidth: 170,
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchingItemSelected: {
    borderColor: '#575757',
    backgroundColor: '#F3F4F6',
  },
  matchingItemCompleted: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
    opacity: 0.7,
  },
  matchingItemIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  matchingItemText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  matchingCheckButton: {
    backgroundColor: '#575757',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    alignSelf: 'center',
  },
  matchingCheckButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  matchingCheckButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  matchingCheckButtonTextDisabled: {
    color: '#9CA3AF',
  },
  answerBoxContainer: {
    backgroundColor: 'transparent',
    borderLeftWidth: 5,
    borderLeftColor: '#3F3F3F',
    paddingLeft: 15,
    paddingRight: 0,
    paddingVertical: 0,
    alignSelf: 'center',
    width: 353,
    maxWidth: '100%',
    minHeight: 80,
    marginTop: 20,
    marginBottom: 30,
  },
});
