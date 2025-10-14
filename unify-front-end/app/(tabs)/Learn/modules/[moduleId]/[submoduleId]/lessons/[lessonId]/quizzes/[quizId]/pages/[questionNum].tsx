import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuizQuestions } from '@/hooks/useQuizQuestions';
import { useSubmoduleLessons } from '@/hooks/learn/useSubmoduleLessons';
import { useLessonQuizzes } from '@/hooks/useLessonQuizzes';

export default function QuizQuestionPage() {
  const { moduleId, submoduleId, lessonId, quizId, questionNum } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    lessonId: string;
    quizId: string;
    questionNum: string;
  }>();

  const currentQuestionIndex = parseInt(questionNum || '1') - 1;
  const { data: questions, isLoading, error } = useQuizQuestions(quizId);
  const { data: quizzes } = useLessonQuizzes(lessonId);
  const { data: submoduleData } = useSubmoduleLessons(submoduleId);

  // Debug logging
  console.log('Quiz ID:', quizId);
  console.log('Questions data:', questions);
  console.log('Questions loading:', isLoading);
  console.log('Questions error:', error);
  if (questions && questions.length > 0) {
    console.log('First question data:', questions[0]);
    console.log('First question options:', questions[0].options);
  }

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

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
  const currentQuiz = quizzes?.find(q => q.quiz_id === quizId);

  // Helper functions for sequential navigation
  const getCurrentLessonIndex = () => {
    if (!submoduleData?.lessons) return -1;
    return submoduleData.lessons.findIndex(l => l.lesson_id === lessonId);
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

  if (!currentQuestion) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Question not found</Text>
      </View>
    );
  }

  const handleAnswerSelect = (optionId: string) => {
    setSelectedAnswer(optionId);
  };

  const handleNext = () => {
    if (!hasSubmitted) {
      // First submission - check if answer is correct
      const correctAnswerId = currentQuestion.correct_answer?.correctOptionId || currentQuestion.correct_answer;
      const isAnswerCorrect = selectedAnswer === correctAnswerId;
      
      setIsCorrect(isAnswerCorrect);
      setHasSubmitted(true);
    } else {
      // Already submitted and correct - proceed to next
      if (isLastQuestion) {
        // Quiz completed, check if there are more quizzes or go to next lesson
        const sortedQuizzes = quizzes?.sort((a, b) => a.order_number - b.order_number) || [];
        const currentQuizIndex = sortedQuizzes.findIndex(q => q.quiz_id === quizId);
        const nextQuiz = sortedQuizzes[currentQuizIndex + 1];
        
        if (nextQuiz) {
          // Go to next quiz
          router.push({
            pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/quizzes/[quizId]/pages/[questionNum]' as any,
            params: { 
              moduleId, 
              submoduleId, 
              lessonId, 
              quizId: nextQuiz.quiz_id, 
              questionNum: '1' 
            },
          });
        } else {
          // All quizzes completed, go to next lesson or map
          const nextLesson = getNextLesson();
          if (nextLesson) {
            router.push({
              pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/pages/[pageNum]' as any,
              params: { moduleId, submoduleId, lessonId: nextLesson.lesson_id, pageNum: '1' },
            });
          } else {
            // Last lesson completed, go back to map
            router.push({
              pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/map' as any,
              params: { moduleId, submoduleId },
            });
          }
        }
      } else {
        // Go to next question
        router.push({
          pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/quizzes/[quizId]/pages/[questionNum]' as any,
          params: { 
            moduleId, 
            submoduleId, 
            lessonId, 
            quizId, 
            questionNum: (currentQuestionIndex + 2).toString() 
          },
        });
      }
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      // Go to previous question
      router.push({
        pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/quizzes/[quizId]/pages/[questionNum]' as any,
        params: { 
          moduleId, 
          submoduleId, 
          lessonId, 
          quizId, 
          questionNum: currentQuestionIndex.toString() 
        },
      });
    } else {
      // First question, go back to lesson
      router.push({
        pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/pages/[pageNum]' as any,
        params: { moduleId, submoduleId, lessonId, pageNum: '1' },
      });
    }
  };

  const renderQuestionContent = (content: any[]) => {
    return content.map((item, index) => (
      <Text
        key={index}
        style={[
          styles.questionText,
          item.bold && styles.boldText,
          item.italic && styles.italicText,
        ]}
      >
        {item.text}
      </Text>
    ));
  };

  const renderOptionContent = (content: any[]) => {
    return content.map((item, index) => (
      <Text
        key={index}
        style={[
          styles.optionText,
          item.bold && styles.boldText,
          item.italic && styles.italicText,
        ]}
      >
        {item.text}
      </Text>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Section 1: Foundations of Budgeting</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }]} />
          </View>
        </View>

        {/* Question Content */}
        <View style={styles.content}>
          {/* Quiz Title */}
          {currentQuiz?.title && (
            <Text style={styles.quizTitle}>{currentQuiz.title}</Text>
          )}
          
          <View style={styles.questionContainer}>
            <View style={styles.questionContent}>
              {renderQuestionContent(
                Array.isArray(currentQuestion.question_text)
                  ? currentQuestion.question_text
                  : [{ text: currentQuestion.question_text }]
              )}
            </View>

            <View style={styles.optionsContainer}>
              {(Array.isArray(currentQuestion.options) ? currentQuestion.options : 
                Array.isArray(currentQuestion.options?.options) ? currentQuestion.options.options : []).map((option) => {
                const correctAnswerId = currentQuestion.correct_answer?.correctOptionId || currentQuestion.correct_answer;
                const isSelected = selectedAnswer === option.id;
                const isCorrectOption = option.id === correctAnswerId;
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
                    key={option.id}
                    style={optionStyle}
                    onPress={() => !showFeedback && handleAnswerSelect(option.id)}
                    disabled={showFeedback}
                  >
                    <View style={styles.optionRow}>
                      <View style={checkboxStyle}>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={styles.optionContent}>
                        {renderOptionContent(option.content)}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.checkButton,
              !selectedAnswer && styles.checkButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!selectedAnswer}
          >
            <Text style={[
              styles.checkButtonText,
              !selectedAnswer && styles.checkButtonTextDisabled
            ]}>
              {!hasSubmitted ? 'Check' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    padding: 20,
    flex: 1,
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  questionContainer: {
    gap: 24,
  },
  questionContent: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 18,
    color: '#000',
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  optionButtonSelected: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#F3F4F6',
  },
  optionButtonCorrect: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    borderColor: '#10B981',
    backgroundColor: '#F3F4F6',
  },
  optionButtonIncorrect: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    borderColor: '#EF4444',
    backgroundColor: '#F3F4F6',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    backgroundColor: '#fff',
    justifyContent: 'center',
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
    alignItems: 'center'
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
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 0,
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 0.4,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  checkButton: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 0.4,
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
});
