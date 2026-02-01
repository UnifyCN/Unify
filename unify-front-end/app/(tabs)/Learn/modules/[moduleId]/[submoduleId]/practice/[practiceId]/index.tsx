import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSanityPractice } from '@/hooks/sanity/useSanityPractices';

export default function PracticeEntryScreen() {
  const { moduleId, submoduleId, practiceId } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    practiceId: string;
  }>();

  const { data: practice, isLoading, error } = useSanityPractice(
    practiceId || ''
  );

  useEffect(() => {
    if (!practice || !moduleId || !submoduleId || !practiceId) return;
    if (practice.practice_type === 'quiz') {
      const hasQuestions =
        Array.isArray(practice.questions) && practice.questions.length > 0;
      if (hasQuestions) {
        router.replace({
          pathname:
            '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/practice/[practiceId]/pages/[questionNum]' as any,
          params: { moduleId, submoduleId, practiceId, questionNum: '1' },
        });
      }
    } else {
      const hasPages =
        Array.isArray(practice.pages) && practice.pages.length > 0;
      if (hasPages) {
        router.replace({
          pathname:
            '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/practice/[practiceId]/activity/[pageNum]' as any,
          params: { moduleId, submoduleId, practiceId, pageNum: '1' },
        });
      }
    }
  }, [practice, moduleId, submoduleId, practiceId]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  if (error || !practice) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>
          {error?.message || 'Practice not found'}
        </Text>
      </View>
    );
  }

  const hasContent =
    (practice.practice_type === 'quiz' &&
      Array.isArray(practice.questions) &&
      practice.questions.length > 0) ||
    (practice.practice_type === 'activity' &&
      Array.isArray(practice.pages) &&
      practice.pages.length > 0);

  if (!hasContent) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No content in this practice yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#10B981" />
      <Text style={styles.text}>Opening...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  text: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  error: { fontSize: 16, color: '#EF4444', textAlign: 'center' },
});
