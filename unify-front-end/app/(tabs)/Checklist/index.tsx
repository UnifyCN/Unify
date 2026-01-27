import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStage } from '@/hooks/onboarding/useUserStage';
import { useChecklistTasks } from '@/hooks/checklist/useChecklistTasks';
import { getOnboardingProfile } from '@/services/onboarding/getOnboardingProfile';
import { updateTaskCompletion } from '@/services/checklist/updateTaskCompletion';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ChecklistSection } from '@/components/checklist/ChecklistSection';
import { TaskDetailModal } from '@/components/checklist/TaskDetailModal';
import { supabase } from '@/lib/supabase';
import { Priority, UserTaskWithDetails } from '@/types/checklist';
import Header from '@/components/Header';

const stageDescriptions = {
  0: 'Not Arrived Yet',
  1: '0-3 Months',
  2: '3-12 Months',
  3: '1-3 Years',
  4: '3+ Years',
};

const personaDisplayNames = {
  international_student: 'International Student',
  skilled_worker: 'Skilled Worker',
  refugee: 'Refugee',
  other: 'Other',
};

export default function ChecklistScreen() {
  const router = useRouter();
  const {
    currentStage,
    stageChanged,
    isLoading: stageLoading,
  } = useUserStage();
  const [persona, setPersona] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [selectedTask, setSelectedTask] = useState<UserTaskWithDetails | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchPersona = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const profile = await getOnboardingProfile(user.id);
          setPersona(profile?.persona || null);
        }
      } catch (error) {
        console.error('Error fetching persona:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchPersona();
  }, []);

  const {
    tasks,
    isLoading: tasksLoading,
    refetch,
    setTasks,
  } = useChecklistTasks({
    currentStage,
    stageChanged,
    persona,
  });

  // Compute progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercent = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const isLoading = stageLoading || isLoadingProfile || tasksLoading;

  // Group tasks by priority
  const tasksByPriority = tasks.reduce(
    (acc, task) => {
      const priority = task.task.priority;
      if (!acc[priority]) {
        acc[priority] = [];
      }
      acc[priority].push(task);
      return acc;
    },
    {} as Record<Priority, typeof tasks>
  );

  const priorities: Priority[] = [
    'Do now',
    'Do soon',
    'Explore & connect',
    'Optional / later',
  ];

  const handleTaskPress = (task: UserTaskWithDetails) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTask(null);
  };

  const handleLearnHow = () => {
    handleCloseModal();
    // Navigate to Learn tab - for now just go to learn home
    router.push('/(tabs)/Learn');
  };

  const handleMarkComplete = async () => {
    if (!selectedTask) return;

    try {
      const newCompletedStatus = !selectedTask.completed;

      // Optimistically update UI
      const updatedTasks = tasks.map(task =>
        task.user_task_id === selectedTask.user_task_id
          ? {
              ...task,
              completed: newCompletedStatus,
              completed_at: newCompletedStatus
                ? new Date().toISOString()
                : null,
            }
          : task
      );
      setTasks(updatedTasks);

      // Update selected task state
      setSelectedTask({
        ...selectedTask,
        completed: newCompletedStatus,
      });

      // Update database in background
      await updateTaskCompletion(selectedTask.user_task_id, newCompletedStatus);
    } catch (error) {
      console.error('Error updating task completion:', error);
      // Revert on error
      refetch();
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size='large' />
      </ThemedView>
    );
  }

  const stageDescription =
    currentStage !== null
      ? stageDescriptions[currentStage as keyof typeof stageDescriptions]
      : 'Stage Not Set';
  const personaDisplay = persona
    ? personaDisplayNames[persona as keyof typeof personaDisplayNames]
    : 'User';

  // Don't show checklist if stage is null
  if (currentStage === null) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <ThemedText style={styles.title}>
              Your Personalized Checklist
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Please complete your onboarding to see your personalized
              checklist.
            </ThemedText>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header showSearchIcon={true} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            Your Personalized Checklist
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {personaDisplay} - {stageDescription}
          </ThemedText>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${progressPercent * 100}%` },
              ]}
            />
          </View>
        </View>

        {priorities.map(priority => {
          const priorityTasks = tasksByPriority[priority] || [];

          return (
            <ChecklistSection
              key={priority}
              priority={priority}
              tasks={priorityTasks}
              onTaskPress={handleTaskPress}
            />
          );
        })}

        {tasks.length === 0 && (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              No tasks available for your current stage.
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <TaskDetailModal
        visible={modalVisible}
        task={selectedTask}
        onClose={handleCloseModal}
        onLearnHow={handleLearnHow}
        onMarkComplete={handleMarkComplete}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    paddingTop: 8,
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#000',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#A0AEC0',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#eaeaea',
    borderRadius: 5,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 5,
  },
});
