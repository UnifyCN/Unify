import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Quiz, QuizQuestion } from '../../types/learn';

interface QuizComponentProps {
  quiz: Quiz;
  questions: QuizQuestion[];
  onComplete: (score: number, total: number) => void;
}

export const QuizComponent: React.FC<QuizComponentProps> = ({
  quiz,
  questions,
  onComplete,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Calculate score
      const correctAnswers = questions.filter(
        q => selectedAnswers[q.id] === q.correct_answer
      ).length;
      onComplete(correctAnswers, questions.length);
      setShowResults(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
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

  if (showResults) {
    const correctAnswers = questions.filter(
      q => selectedAnswers[q.id] === q.correct_answer
    ).length;
    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= quiz.passing_score;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              {passed ? '🎉 Great Job!' : '📚 Keep Learning!'}
            </Text>
            <Text style={styles.scoreText}>
              You scored {correctAnswers} out of {questions.length} ({score}%)
            </Text>
            <Text style={styles.passingText}>
              Passing score: {quiz.passing_score}%
            </Text>
            {passed ? (
              <Text style={styles.congratulationsText}>
                Congratulations! You passed the quiz.
              </Text>
            ) : (
              <Text style={styles.encouragementText}>
                Don't worry! Review the lesson and try again.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.quizTitle}>{quiz.title}</Text>
          {quiz.description && (
            <Text style={styles.quizDescription}>{quiz.description}</Text>
          )}
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionNumber}>
            Question {currentQuestionIndex + 1}
          </Text>
          <View style={styles.questionContent}>
            {Array.isArray(currentQuestion.question_text) 
              ? renderQuestionContent(currentQuestion.question_text)
              : <Text style={styles.questionText}>{currentQuestion.question_text}</Text>}
          </View>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  selectedAnswers[currentQuestion.id] === option.id &&
                    styles.optionButtonSelected,
                ]}
                onPress={() =>
                  handleAnswerSelect(currentQuestion.id, option.id)
                }
              >
                <View style={styles.optionContent}>
                  {renderOptionContent(option.content)}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !selectedAnswers[currentQuestion.id] &&
                styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!selectedAnswers[currentQuestion.id]}
          >
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  quizDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  progressContainer: {
    padding: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  questionContainer: {
    padding: 20,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
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
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  optionButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  optionContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 0,
  },
  nextButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  passingText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  congratulationsText: {
    fontSize: 16,
    color: '#059669',
    textAlign: 'center',
    fontWeight: '600',
  },
  encouragementText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '600',
  },
  boldText: {
    fontWeight: '700',
  },
  italicText: {
    fontStyle: 'italic',
  },
});
