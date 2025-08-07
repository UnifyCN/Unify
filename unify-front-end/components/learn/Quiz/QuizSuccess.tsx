import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { QuizResults } from '@/types/quiz';

interface QuizSuccessProps {
  results: QuizResults;
  onRetry?: () => void;
  onContinue?: () => void;
}

const QuizSuccess = ({ results, onRetry, onContinue }: QuizSuccessProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Congratulations!</Text>
      <Text style={styles.subtitle}>You passed the quiz!</Text>

      <Text style={styles.score}>
        {results.correctAnswers} / {results.totalQuestions} correct
      </Text>

      {results.wrongAnswers.length > 0 && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>Review your mistakes:</Text>
          {results.wrongAnswers.map((wrong, index) => (
            <View key={index} style={styles.reviewItem}>
              <Text style={styles.question}>{wrong.question}</Text>
              <Text style={styles.explanation}>{wrong.explanation}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.buttonContainer}>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
        {onContinue && (
          <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  score: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
  },
  reviewSection: {
    marginBottom: 30,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  reviewItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  explanation: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  retryButton: {
    backgroundColor: '#ccc',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuizSuccess;
