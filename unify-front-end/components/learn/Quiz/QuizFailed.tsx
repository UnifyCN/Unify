import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { QuizResults } from '@/types/quiz';

interface QuizFailedProps {
  results: QuizResults;
  onRetry?: () => void;
}

const QuizFailed = ({ results, onRetry }: QuizFailedProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>❌ Try Again</Text>
      <Text style={styles.subtitle}>You didn't pass this time</Text>

      <Text style={styles.score}>
        {results.correctAnswers} / {results.totalQuestions} correct
      </Text>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Review your mistakes:</Text>
        {results.wrongAnswers.map((wrong, index) => (
          <View key={index} style={styles.reviewItem}>
            <Text style={styles.question}>{wrong.question}</Text>
            <Text style={styles.explanation}>{wrong.explanation}</Text>
          </View>
        ))}
      </View>

      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry Quiz</Text>
        </TouchableOpacity>
      )}
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
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuizFailed;
