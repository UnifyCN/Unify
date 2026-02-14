import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useUserStage } from '@/hooks/onboarding/useUserStage';
import { useChecklistTasks } from '@/hooks/checklist/useChecklistTasks';
import { getOnboardingProfile } from '@/services/onboarding/getOnboardingProfile';
import { setChecklistItemCompletion } from '@/services/checklist/setChecklistItemCompletion';
import { getCustomUserTasks } from '@/services/checklist/getCustomUserTasks';
import { createCustomUserTask } from '@/services/checklist/createCustomUserTask';
import { deleteCustomUserTask } from '@/services/checklist/deleteCustomUserTask';
import { updateCustomTaskCompletion } from '@/services/checklist/updateCustomTaskCompletion';
import { ChecklistSection } from '@/components/checklist/ChecklistSection';
import { TaskDetailModal } from '@/components/checklist/TaskDetailModal';
import { AddTaskModal } from '@/components/checklist/AddTaskModal';
import { supabase } from '@/lib/supabase';
import { Priority, UserTaskWithDetails, CustomUserTask } from '@/types/checklist';
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
  
  // Regular (Sanity/Legacy) tasks
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

  // Custom user tasks
  const [customTasks, setCustomTasks] = useState<CustomUserTask[]>([]);
  const [isLoadingCustom, setIsLoadingCustom] = useState(true);

  // Modal state
  const [selectedTask, setSelectedTask] = useState<UserTaskWithDetails | CustomUserTask | null>(null);
  const [selectedCustomTask, setSelectedCustomTask] = useState<CustomUserTask | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Fetch persona
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

  // Fetch custom tasks
  const fetchCustomTasks = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      
      const tasks = await getCustomUserTasks(user.id);
      setCustomTasks(tasks);
    } catch (error) {
      console.error('Error fetching custom tasks:', error);
    } finally {
      setIsLoadingCustom(false);
    }
  }, []);

  // Initial fetch and refetch on focus
  useEffect(() => {
    fetchCustomTasks();
  }, [fetchCustomTasks]);

  useFocusEffect(
    useCallback(() => {
      if (currentStage !== null && persona) {
        refetch();
        fetchCustomTasks();
      }
    }, [currentStage, persona, refetch, fetchCustomTasks])
  );

  // Compute progress (including custom tasks)
  const totalTasks = tasks.length + customTasks.length;
  const completedTasks = tasks.filter(t => t.completed).length + customTasks.filter(t => t.completed).length;
  const progressPercent = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const isLoading = stageLoading || isLoadingProfile || tasksLoading || isLoadingCustom;

  // Normalize so "Explore & connect" and "Explore and connect" are one section
  const normalizePriority = (p: Priority): Priority =>
    p === 'Explore & connect' ? 'Explore and connect' : p;

  // Group regular tasks by priority
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

  // Group custom tasks by priority
  const customTasksByPriority = customTasks.reduce(
    (acc, task) => {
      const priority = normalizePriority(task.priority);
      if (!acc[priority]) {
        acc[priority] = [];
      }
      acc[priority].push(task);
      return acc;
    },
    {} as Record<Priority, typeof customTasks>
  );

  const priorities: Priority[] = [
    'Do now',
    'Do soon',
    'Explore and connect',
    'Optional / later',
  ];

  const handleTaskPress = (task: UserTaskWithDetails) => {
    setSelectedTask(task);
    setSelectedCustomTask(null);
    setModalVisible(true);
  };

  const handleCustomTaskPress = (task: CustomUserTask) => {
    setSelectedCustomTask(task);
    setSelectedTask(null);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTask(null);
    setSelectedCustomTask(null);
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
    // Handle regular task completion
    if (selectedTask && !selectedCustomTask) {
      if (selectedTask.sanity_checklist_id == null) return;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const newCompletedStatus = !selectedTask.completed;

        // Optimistically update UI
        const updatedTasks = tasks.map(task =>
          task.sanity_checklist_id === selectedTask.sanity_checklist_id
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

        setSelectedTask({
          ...selectedTask,
          completed: newCompletedStatus,
        } as UserTaskWithDetails);

        await setChecklistItemCompletion(
          user.id,
          selectedTask.sanity_checklist_id,
          newCompletedStatus
        );
      } catch (error) {
        console.error('Error updating task completion:', error);
        refetch();
      }
    }
    
    // Handle custom task completion
    if (selectedCustomTask && !selectedTask) {
      try {
        const newCompletedStatus = !selectedCustomTask.completed;

        // Optimistically update UI
        setCustomTasks(prev =>
          prev.map(task =>
            task.id === selectedCustomTask.id
              ? {
                  ...task,
                  completed: newCompletedStatus,
                  completed_at: newCompletedStatus
                    ? new Date().toISOString()
                    : null,
                }
              : task
          )
        );

        setSelectedCustomTask({
          ...selectedCustomTask,
          completed: newCompletedStatus,
        });

        await updateCustomTaskCompletion(selectedCustomTask.id, newCompletedStatus);
      } catch (error) {
        console.error('Error updating custom task completion:', error);
        fetchCustomTasks();
      }
    }
  };

  const handleAddCustomTask = async (taskName: string, taskDescription: string, priority: Priority) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const newTask = await createCustomUserTask({
        userId: user.id,
        taskName,
        taskDescription,
        priority,
      });

      setCustomTasks(prev => [...prev, newTask]);
    } catch (error) {
      console.error('Error adding custom task:', error);
    }
  };

  const handleDeleteCustomTask = async () => {
    if (!selectedCustomTask) return;

    try {
      // Optimistically remove from UI
      const taskIdToDelete = selectedCustomTask.id;
      setCustomTasks(prev => prev.filter(t => t.id !== taskIdToDelete));
      handleCloseModal();

      await deleteCustomUserTask(taskIdToDelete);
    } catch (error) {
      console.error('Error deleting custom task:', error);
      fetchCustomTasks();
    }
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
            <Text style={styles.title}>Your Personalized Checklist</Text>
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
          <Text style={styles.title}>Your Personalized Checklist</Text>
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

        {/* Add Custom Task Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.7}
        >
          <MaterialIcons name='add' size={20} color='#E03B3B' />
          <Text style={styles.addButtonText}>Add custom task</Text>
        </TouchableOpacity>

        {priorities.map(priority => {
          const priorityTasks = tasksByPriority[priority] || [];
          const priorityCustomTasks = customTasksByPriority[priority] || [];

          // Only render section if there are any tasks
          if (priorityTasks.length === 0 && priorityCustomTasks.length === 0) {
            return null;
          }

          return (
            <View key={priority}>
              {/* Regular Tasks Section */}
              {priorityTasks.length > 0 && (
                <ChecklistSection
                  priority={priority}
                  tasks={priorityTasks}
                  onTaskPress={handleTaskPress}
                />
              )}

              {/* Custom Tasks Section */}
              {priorityCustomTasks.length > 0 && (
                <ChecklistSection
                  priority={priority}
                  tasks={priorityCustomTasks.map(task => ({
                    id: `custom-${task.id}`,
                    source: 'custom' as const,
                    user_task_id: undefined,
                    sanity_checklist_id: null,
                    completed: task.completed,
                    completed_at: task.completed_at,
                    task: {
                      task_name: task.task_name,
                      task_description: task.task_description || '',
                      priority: task.priority,
                    },
                  }))}
                  onTaskPress={(task: any) => {
                    // Find the actual custom task
                    const customTask = customTasks.find(t => t.id === task.id?.replace('custom-', ''));
                    if (customTask) {
                      handleCustomTaskPress(customTask);
                    }
                  }}
                />
              )}
            </View>
          );
        })}

        {totalTasks === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No tasks available for your current stage.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Task Detail Modal */}
      <TaskDetailModal
        visible={modalVisible}
        task={selectedCustomTask || selectedTask}
        isCustomTask={!!selectedCustomTask}
        onClose={handleCloseModal}
        onLearnHow={handleLearnHow}
        onMarkComplete={handleMarkComplete}
        onDelete={handleDeleteCustomTask}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAddTask={handleAddCustomTask}
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    paddingTop: 8,
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: '#000',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E03B3B',
    borderStyle: 'dashed',
    marginBottom: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E03B3B',
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
