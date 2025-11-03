import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  getModuleProgress,
  getSubmoduleProgress,
} from '@/services/progress/progressService';

interface ProgressTestComponentProps {
  moduleId: string;
  submoduleId?: string;
}

export default function ProgressTestComponent({
  moduleId,
  submoduleId,
}: ProgressTestComponentProps) {
  const [moduleProgress, setModuleProgress] = useState<any>(null);
  const [submoduleProgress, setSubmoduleProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testProgress = async () => {
      try {
        setLoading(true);
        setError(null);

        // Test module progress
        const module = await getModuleProgress(moduleId);
        setModuleProgress(module);

        // Test submodule progress if submoduleId provided
        if (submoduleId) {
          const submodule = await getSubmoduleProgress(submoduleId);
          setSubmoduleProgress(submodule);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch progress'
        );
        console.error('Progress test error:', err);
      } finally {
        setLoading(false);
      }
    };

    testProgress();
  }, [moduleId, submoduleId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Testing progress tracking...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.text}>
          This is expected if the database tables don't exist yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress Test Results</Text>

      <Text style={styles.text}>Module Progress:</Text>
      <Text style={styles.text}>
        {moduleProgress
          ? `Completed: ${moduleProgress.completed_submodules}/${moduleProgress.total_submodules}, Progress: ${moduleProgress.progress_percent}%`
          : 'No module progress found'}
      </Text>

      {submoduleId && (
        <>
          <Text style={styles.text}>Submodule Progress:</Text>
          <Text style={styles.text}>
            {submoduleProgress
              ? `Completed: ${submoduleProgress.completed_pages}/${submoduleProgress.total_pages}, Progress: ${submoduleProgress.progress_percent}%`
              : 'No submodule progress found'}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    margin: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    marginBottom: 4,
  },
});
