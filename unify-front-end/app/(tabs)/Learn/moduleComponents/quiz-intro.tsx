import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import sampleQuiz from '@/data/sampleQuiz';
import { Quiz } from '@/types/quiz';
import QuizScreen from '@/components/learn/Quiz/QuizScreen';

// TODO: Props to add id for fetch, could add some descriptions of the quiz, onSuccess function to navigate to new module?
const QuizIntro = () => {
  const [showQuiz, setShowQuiz] = useState<boolean>(false);

  // Remove once hook is implemented
  const [quiz, setQuiz] = useState<Quiz>(sampleQuiz);

  // TODO: Implement actual quiz fetching hook
  // const { data: quiz, isLoading, error } = useQuiz(quizId);

  if (showQuiz) {
    return (
      <QuizScreen
        quiz={quiz}
        onComplete={passed => {
          setShowQuiz(false);
          if (passed) {
            // Handle success - save quiz completion/update progress etc - call onSuccess here
          } else {
            // Handle failure - go back to module lesson or just show quiz intro again
          }
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{quiz.title}</Text>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Quiz Information</Text>
          <Text style={styles.infoText}>
            • {quiz.questions.length} questions
          </Text>
          <Text style={styles.infoText}>• 70% required to pass</Text>
          <Text style={styles.infoText}>• You can retry if you don't pass</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.startButton}
            onPress={() => setShowQuiz(true)}
          >
            <Text style={styles.startButtonText}>Start Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  infoSection: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuizIntro;
