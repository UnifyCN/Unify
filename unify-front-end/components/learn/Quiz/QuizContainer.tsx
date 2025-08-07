import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Quiz, QuizResults } from '@/types/quiz';
interface QuizContainerProps {
  quiz: Quiz;
  onSuccess?: (results: QuizResults) => void;
  onFailed?: (results: QuizResults) => void;
}

const QuizContainer = ({ quiz, onSuccess, onFailed }: QuizContainerProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz completed
      const correctAnswers = quiz.questions.filter(
        (q, index) => selectedAnswers[index] === q.correctAnswer
      ).length;

      const wrongAnswers = quiz.questions
        .map((q, index) => {
          const selected = selectedAnswers[index];
          return selected !== q.correctAnswer
            ? {
                question: q.question,
                selectedAnswer: selected,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
              }
            : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      const results: QuizResults = {
        correctAnswers,
        totalQuestions: quiz.questions.length,
        wrongAnswers,
      };

      setIsCompleted(true);

      // Determine pass/fail (you can adjust the threshold)
      const passThreshold = 0.7; // 70%
      const passPercentage = correctAnswers / quiz.questions.length;

      if (passPercentage >= passThreshold) {
        onSuccess?.(results);
      } else {
        onFailed?.(results);
      }
    }
  };

  const canProceed = selectedAnswers[currentQuestion] !== undefined;

  if (isCompleted) {
    return null; // Let parent handle success/failed components
  }

  const currentQ = quiz.questions[currentQuestion];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{quiz.title}</Text>

      <Text style={styles.progress}>
        {currentQuestion + 1} / {quiz.questions.length}
      </Text>

      <Text style={styles.question}>{currentQ.question}</Text>

      <View style={styles.optionsContainer}>
        {currentQ.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              selectedAnswers[currentQuestion] === index &&
                styles.selectedOption,
            ]}
            onPress={() => handleAnswerSelect(index)}
          >
            <View
              style={[
                styles.circle,
                selectedAnswers[currentQuestion] === index &&
                  styles.selectedCircle,
              ]}
            />
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.nextButton, !canProceed && styles.disabledButton]}
        onPress={handleNext}
        disabled={!canProceed}
      >
        <Text style={styles.nextButtonText}>
          {currentQuestion === quiz.questions.length - 1 ? 'Submit' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  progress: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  question: {
    fontSize: 18,
    marginBottom: 30,
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 40,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  selectedOption: {
    backgroundColor: '#f0f0f0',
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 15,
  },
  selectedCircle: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuizContainer;
