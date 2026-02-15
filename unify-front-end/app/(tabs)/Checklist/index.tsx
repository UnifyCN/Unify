import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useUserStage } from '@/hooks/onboarding/useUserStage';
import { useChecklistTasks } from '@/hooks/checklist/useChecklistTasks';
import { getOnboardingProfile } from '@/services/onboarding/getOnboardingProfile';
import { setChecklistItemCompletion } from '@/services/checklist/setChecklistItemCompletion';
import {
  deleteCustomChecklistTask,
  setCustomChecklistTaskCompletion,
} from '@/services/checklist/customChecklistTasks';
import { ChecklistSection } from '@/components/checklist/ChecklistSection';
import { TaskDetailModal } from '@/components/checklist/TaskDetailModal';
import { supabase } from '@/lib/supabase';
import { Priority, UserTaskWithDetails } from '@/types/checklist';
import Header from '@/components/Header';
import LoadingScreen from '@/components/LoadingScreen';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/** Time-in-Canada display ranges (no stage labels) */
const stageDescriptions: Record<number, string> = {
  0: 'Not arrived yet',
  1: '0–3 months',
  2: '3–12 months',
  3: '1–3 years',
  4: '3+ years',
};

/** Persona display labels per checklist spec (exactly 6 slugs) */
const personaDisplayNames: Record<string, string> = {
  international_student: 'International Student',
  refugee: 'Refugee',
  protected_person: 'Protected Person',
  skilled_worker: 'Skilled Worker',
  immigrant: 'Immigrant',
  pr: 'PR',
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

  // Refetch when Checklist tab is focused so new/updated Sanity tasks show up
  useFocusEffect(
    useCallback(() => {
      if (currentStage !== null && persona) {
        refetch();
      }
    }, [currentStage, persona, refetch])
  );

  // Compute progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercent = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const isLoading = stageLoading || isLoadingProfile || tasksLoading;

  // Normalize so "Explore & connect" and "Explore and connect" are one section
  const normalizePriority = (p: Priority): Priority =>
    p === 'Explore & connect' ? 'Explore and connect' : p;

  // Group tasks by priority
  const tasksByPriority = tasks.reduce(
    (acc, task) => {
      const priority = normalizePriority(task.task.priority);
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
    'Explore and connect',
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
    if (!selectedTask?.task) {
      handleCloseModal();
      return;
    }
    const { linkModuleId, linkSubmoduleId } = selectedTask.task;
    handleCloseModal();
    if (linkSubmoduleId && linkModuleId) {
      router.push(
        `/(tabs)/Learn/modules/${linkModuleId}/${linkSubmoduleId}` as any
      );
    } else if (linkModuleId) {
      router.push(`/(tabs)/Learn/modules/${linkModuleId}` as any);
    } else {
      router.push('/(tabs)/Learn');
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedTask) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const newCompletedStatus = !selectedTask.completed;
      const completedAt = newCompletedStatus ? new Date().toISOString() : null;

      const updatedTasks = tasks.map(task => {
        const isTarget =
          selectedTask.source === 'custom'
            ? task.custom_task_id === selectedTask.custom_task_id
            : task.sanity_checklist_id === selectedTask.sanity_checklist_id;

        if (!isTarget) return task;
        return {
          ...task,
          completed: newCompletedStatus,
          completed_at: completedAt,
        };
      });
      setTasks(updatedTasks);

      setSelectedTask({
        ...selectedTask,
        completed: newCompletedStatus,
        completed_at: completedAt,
      });

      if (selectedTask.source === 'custom' && selectedTask.custom_task_id) {
        await setCustomChecklistTaskCompletion({
          userId: user.id,
          customTaskId: selectedTask.custom_task_id,
          completed: newCompletedStatus,
        });
      } else if (selectedTask.sanity_checklist_id) {
        await setChecklistItemCompletion(
          user.id,
          selectedTask.sanity_checklist_id,
          newCompletedStatus
        );
      }
    } catch (error) {
      console.error('Error updating task completion:', error);
      refetch();
    }
  };

  const handleDeleteCustomTask = () => {
    if (!selectedTask || selectedTask.source !== 'custom') return;
    const customTaskId = selectedTask.custom_task_id;
    if (!customTaskId) return;

    Alert.alert('Delete item?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const prevTasks = tasks;
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            setTasks(prev =>
              prev.filter(task => task.custom_task_id !== customTaskId)
            );
            handleCloseModal();

            await deleteCustomChecklistTask({
              userId: user.id,
              customTaskId,
            });
          } catch (error) {
            console.error('Error deleting custom checklist task:', error);
            setTasks(prevTasks);
            refetch();
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const stageDescription =
    currentStage !== null
      ? stageDescriptions[currentStage as keyof typeof stageDescriptions]
      : 'Stage Not Set';
  const personaDisplay = persona
    ? (personaDisplayNames[persona as keyof typeof personaDisplayNames] ??
      persona)
    : 'User';

  // Don't show checklist if stage is null
  if (currentStage === null) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Your Personalized Checklist</Text>
            </View>
            <Text style={styles.subtitle}>
              Please complete your onboarding to see your personalized
              checklist.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showSearchIcon={true} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Your Personalized Checklist</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                router.push('/(tabs)/Checklist/create-custom-item' as any)
              }
              activeOpacity={0.8}
            >
              <MaterialIcons name='add' size={18} color='#111' />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            {personaDisplay} - {stageDescription}
          </Text>
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
            <Text style={styles.emptyText}>
              No tasks available for your current stage.
            </Text>
          </View>
        )}
      </ScrollView>

      <TaskDetailModal
        visible={modalVisible}
        task={selectedTask}
        onClose={handleCloseModal}
        onLearnHow={handleLearnHow}
        onMarkComplete={handleMarkComplete}
        isCustomTask={selectedTask?.source === 'custom'}
        onDeleteCustomTask={handleDeleteCustomTask}
      />
    </View>
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
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    paddingTop: 8,
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  addButton: {
    marginTop: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  subtitle: {
    marginTop: 6,
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
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 5,
  },
});
