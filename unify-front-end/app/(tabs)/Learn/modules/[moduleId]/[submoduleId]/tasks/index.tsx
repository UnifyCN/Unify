import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSanityTasks } from '@/hooks/sanity/useSanityTasks';
import { useTaskProgress } from '@/hooks/progress/useTaskProgress';

export default function TasksEntryScreen() {
  const router = useRouter();
  const { moduleId, submoduleId } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
  }>();

  const { data: tasks, isLoading, error } = useSanityTasks(submoduleId || '');
  const { getTaskProgressBySubmodule } = useTaskProgress();

  useEffect(() => {
    if (!moduleId || !submoduleId || isLoading || error) return;
    const sorted = [...(tasks || [])].sort(
      (a, b) => (a.ordering ?? 0) - (b.ordering ?? 0)
    );
    if (sorted.length === 0) return;

    let cancelled = false;
    getTaskProgressBySubmodule(submoduleId).then(progressRows => {
      if (cancelled) return;
      const completedIds = new Set(
        (progressRows || []).filter(r => r.is_completed).map(r => r.sanity_task_id)
      );
      const firstIncomplete = sorted.find(t => !completedIds.has(t._id));
      const target = firstIncomplete ?? sorted[0];
      router.replace({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/tasks/[taskId]' as any,
        params: { moduleId, submoduleId, taskId: target._id },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [
    moduleId,
    submoduleId,
    tasks,
    isLoading,
    error,
    getTaskProgressBySubmodule,
  ]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error.message || 'Failed to load tasks'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const sorted = [...(tasks || [])].sort(
    (a, b) => (a.ordering ?? 0) - (b.ordering ?? 0)
  );

  if (sorted.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No tasks for this section yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Opening tasks...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  errorText: { fontSize: 16, color: '#EF4444', textAlign: 'center' },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
