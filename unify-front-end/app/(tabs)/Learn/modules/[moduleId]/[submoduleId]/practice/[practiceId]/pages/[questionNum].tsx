import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSanityPractice } from '@/hooks/sanity/useSanityPractices';
import { useSanitySubmoduleWithLessons } from '@/hooks/sanity/useSanitySubmodules';
import { useSanityModule } from '@/hooks/sanity/useSanityModules';
import RichTextRenderer from '@/components/sanity/RichTextRenderer';
import SubmoduleProgressBar from '@/components/learn/SubmoduleProgressBar';

function goToSubmoduleIndex(moduleId: string, submoduleId: string) {
  router.push({
    pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]' as any,
    params: { moduleId, submoduleId },
  });
}

export default function PracticeQuizQuestionPage() {
  const { moduleId, submoduleId, practiceId, questionNum } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    practiceId: string;
    questionNum: string;
  }>();
  const currentQuestionIndex = parseInt(questionNum || '1') - 1;
  const { data: practice, isLoading, error } = useSanityPractice(practiceId || '');
  const { data: submoduleData } = useSanitySubmoduleWithLessons(submoduleId || '');
  const { data: moduleData } = useSanityModule(moduleId || '');

  const questions = useMemo(() => {
    const q = practice?.questions || [];
    return [...q].sort((a: any, b: any) => (a.order_number ?? 0) - (b.order_number ?? 0));
  }, [practice?.questions]);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const quizTitle = practice?.title;

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedLeftItem, setSelectedLeftItem] = useState<string | null>(null);
  const [selectedRightItem, setSelectedRightItem] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<{ [key: string]: string }>({});
  const [completedPairs, setCompletedPairs] = useState<string[]>([]);
  const [incorrectPairs, setIncorrectPairs] = useState<string[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

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
    setIsNavigating(false);
  }, [currentQuestionIndex]);

  const scrambledRightItems = useMemo(() => {
    const question = questions[currentQuestionIndex];
    if (!question || question.question_type !== 'matching' || !question.matching_pairs?.length) return [];
    const rightItems = question.matching_pairs.map((p: any) => p.right_item);
    const shuffled = [...rightItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [questions, currentQuestionIndex]);

  const progress = {
    currentPage: currentQuestionIndex + 1,
    totalPages: totalQuestions,
    progressPercentage: totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0,
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  if (error || !practice) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading practice</Text>
      </View>
    );
  }
  if (!currentQuestion) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Question not found</Text>
      </View>
    );
  }

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const handleAnswerSelect = (optionId: string) => {
    if (currentQuestion.question_type === 'multiple_choice_multiple') {
      setSelectedAnswers(prev =>
        prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelectedAnswer(optionId);
    }
  };

  const handleMatchingItemSelect = (item: string, side: 'left' | 'right') => {
    if (completedPairs.includes(item)) return;
    setIncorrectPairs([]);
    if (side === 'left') {
      setSelectedLeftItem(prev => (prev === item ? null : item));
    } else {
      setSelectedRightItem(prev => (prev === item ? null : item));
    }
  };

  const handleMatchingCheck = () => {
    if (!selectedLeftItem || !selectedRightItem) return;
    const correctMatch = currentQuestion.matching_pairs?.find(
      (p: any) => p.left_item === selectedLeftItem && p.right_item === selectedRightItem
    );
    if (correctMatch) {
      setCompletedPairs(prev => [...prev, selectedLeftItem, selectedRightItem]);
      setMatchedPairs(prev => ({ ...prev, [selectedLeftItem]: selectedRightItem }));
      setIncorrectPairs(prev => prev.filter(i => i !== selectedLeftItem && i !== selectedRightItem));
    } else {
      setIncorrectPairs(prev => [...prev, selectedLeftItem, selectedRightItem]);
    }
    setSelectedLeftItem(null);
    setSelectedRightItem(null);
  };

  const handleNext = () => {
    if (isNavigating) return;
    if (currentQuestion.question_type === 'matching') {
      const allDone = completedPairs.length === (currentQuestion.matching_pairs?.length || 0) * 2;
      if (!allDone) return;
      if (isLastQuestion) {
        setIsNavigating(true);
        goToSubmoduleIndex(moduleId!, submoduleId!);
      } else {
        setIsNavigating(true);
        router.push({
          pathname:
            '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/practice/[practiceId]/pages/[questionNum]' as any,
          params: { moduleId, submoduleId, practiceId, questionNum: (currentQuestionIndex + 2).toString() },
        });
      }
      return;
    }
    if (!hasSubmitted) {
      let isAnswerCorrect = false;
      if (currentQuestion.question_type === 'multiple_choice_multiple') {
        const correctIds = (currentQuestion.options || []).filter((o: any) => o.is_correct).map((o: any) => o._key);
        isAnswerCorrect =
          correctIds.length > 0 &&
          correctIds.every((id: string) => selectedAnswers.includes(id)) &&
          selectedAnswers.every((id: string) => correctIds.includes(id));
      } else {
        const correctId =
          currentQuestion.correct_answer?.value?.[0] ?? currentQuestion.correct_answer?.value;
        isAnswerCorrect =
          selectedAnswer === correctId ||
          Boolean((currentQuestion.options || []).find((o: any) => o._key === selectedAnswer)?.is_correct);
      }
      setIsCorrect(isAnswerCorrect);
      setHasSubmitted(true);
      return;
    }
    if (isLastQuestion) {
      setIsNavigating(true);
      goToSubmoduleIndex(moduleId!, submoduleId!);
    } else {
      setIsNavigating(true);
      router.push({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/practice/[practiceId]/pages/[questionNum]' as any,
        params: { moduleId, submoduleId, practiceId, questionNum: (currentQuestionIndex + 2).toString() },
      });
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      router.push({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/practice/[practiceId]/pages/[questionNum]' as any,
        params: { moduleId, submoduleId, practiceId, questionNum: currentQuestionIndex.toString() },
      });
    } else {
      goToSubmoduleIndex(moduleId!, submoduleId!);
    }
  };

  const isMatchingAllDone =
    currentQuestion.question_type === 'matching' &&
    completedPairs.length === (currentQuestion.matching_pairs?.length || 0) * 2;
  const canProceedNonMatching =
    currentQuestion.question_type !== 'matching' &&
    (currentQuestion.question_type === 'multiple_choice_multiple'
      ? selectedAnswers.length > 0
      : !!selectedAnswer);
  const isDisabled =
    currentQuestion.question_type === 'matching'
      ? !isMatchingAllDone
      : !hasSubmitted ? !canProceedNonMatching : false;

  return (
    <SafeAreaView style={styles.container}>
      <SubmoduleProgressBar
        currentProgress={progress.currentPage}
        totalPages={progress.totalPages}
        submoduleTitle={quizTitle || submoduleData?.title || 'Practice'}
        submoduleOrder={submoduleData?.order ?? 1}
        onClose={() => setShowExitModal(true)}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {quizTitle && <Text style={styles.quizTitle}>{quizTitle}</Text>}
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
                  <View style={styles.matchingColumn}>
                    {(currentQuestion.matching_pairs || []).map((pair: any, i: number) => (
                      <TouchableOpacity
                        key={`left-${i}`}
                        style={[
                          styles.matchingItem,
                          selectedLeftItem === pair.left_item && styles.matchingItemSelected,
                          completedPairs.includes(pair.left_item) && styles.matchingItemCompleted,
                          incorrectPairs.includes(pair.left_item) && styles.matchingItemIncorrect,
                        ]}
                        onPress={() => handleMatchingItemSelect(pair.left_item, 'left')}
                        disabled={completedPairs.includes(pair.left_item)}
                      >
                        <Text style={styles.matchingItemText}>{pair.left_item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.matchingColumn}>
                    {scrambledRightItems.map((rightItem: string, i: number) => (
                      <TouchableOpacity
                        key={`right-${i}-${rightItem}`}
                        style={[
                          styles.matchingItem,
                          selectedRightItem === rightItem && styles.matchingItemSelected,
                          completedPairs.includes(rightItem) && styles.matchingItemCompleted,
                          incorrectPairs.includes(rightItem) && styles.matchingItemIncorrect,
                        ]}
                        onPress={() => handleMatchingItemSelect(rightItem, 'right')}
                        disabled={completedPairs.includes(rightItem)}
                      >
                        <Text style={styles.matchingItemText}>{rightItem}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.matchingCheckButton,
                    (!selectedLeftItem || !selectedRightItem) && styles.matchingCheckButtonDisabled,
                  ]}
                  onPress={handleMatchingCheck}
                  disabled={!selectedLeftItem || !selectedRightItem}
                >
                  <Text
                    style={[
                      styles.matchingCheckButtonText,
                      (!selectedLeftItem || !selectedRightItem) && styles.matchingCheckButtonTextDisabled,
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
                            styles={{
                              normal: {
                                ...styles.optionText,
                                marginBottom: 0,
                                marginTop: 0,
                              },
                            }}
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
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.checkButton,
            {
              backgroundColor: isDisabled ? '#F3F4F6' : moduleData?.colorTheme?.hex || '#575757',
            },
          ]}
          onPress={handleNext}
          disabled={isDisabled}
        >
          <Text style={[styles.checkButtonText, isDisabled && styles.checkButtonTextDisabled]}>
            {currentQuestion.question_type === 'matching'
              ? 'Next'
              : !hasSubmitted
                ? 'Check'
                : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
      <Modal visible={showExitModal} transparent animationType="fade" onRequestClose={() => setShowExitModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Take a break from this quiz?</Text>
            <Text style={styles.modalDesc}>
              Your progress will be saved. You can resume from the section page later.
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setShowExitModal(false);
                goToSubmoduleIndex(moduleId!, submoduleId!);
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>Save progress & leave</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setShowExitModal(false)}>
              <Text style={styles.modalSecondaryBtnText}>Continue Quiz</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    alignItems: 'flex-start',
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
    justifyContent: 'center',
    marginTop: 0,
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
    marginTop: 0,
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
    marginTop: 0,
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
    marginTop: 0,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionContent: {
    flex: 1,
    minHeight: 20,
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
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  checkButtonTextDisabled: {
    color: '#9CA3AF',
  },
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
