import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Alert,
  Dimensions,
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useAnalytics } from '@/utils/analytics';
import { useUserStage } from '@/hooks/onboarding/useUserStage';
import { useChecklistTasks } from '@/hooks/checklist/useChecklistTasks';
import { getOnboardingProfile } from '@/services/onboarding/getOnboardingProfile';
import { setChecklistItemCompletion } from '@/services/checklist/setChecklistItemCompletion';
import {
  deleteCustomChecklistTask,
  setCustomChecklistTaskCompletion,
} from '@/services/checklist/customChecklistTasks';
import { upsertChecklistTaskOrder } from '@/services/checklist/checklistTaskOrder';
import { ChecklistSection } from '@/components/checklist/ChecklistSection';
import { TaskDetailModal } from '@/components/checklist/TaskDetailModal';
import { supabase } from '@/lib/supabase';
import {
  ChecklistLinkTabSlug,
  Priority,
  UserTaskWithDetails,
} from '@/types/checklist';
import {
  CHECKLIST_PRIORITY_ORDER,
  normalizeChecklistPriority,
  getChecklistTaskOrderKey,
  replacePriorityBucket,
} from '@/utils/checklistOrder';
import { useHapticsPreference } from '@/context/HapticsContext';
import TabHeader from '@/components/home/HomeHeader';
import LoadingScreen from '@/components/LoadingScreen';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/**
 * Map checklist tab slug to (tabs) route for "Learn how" navigation.
 * Paths must match tab bar in app/(tabs)/_layout.tsx (Tabs.Screen name):
 * - index (Home), Gather (Community), companion, Checklist, Learn.
 */
const TAB_SLUG_TO_ROUTE: Record<ChecklistLinkTabSlug, string> = {
  home: '/(tabs)/index',
  community: '/(tabs)/Gather',
  companion: '/(tabs)/companion',
  checklist: '/(tabs)/Checklist',
  learn: '/(tabs)/Learn',
};

/** Optional aliases if Sanity uses different slug values (e.g. gather → community) */
const TAB_SLUG_ALIASES: Record<string, ChecklistLinkTabSlug> = {
  gather: 'community',
  index: 'home',
};

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
    trackScreen,
    trackChecklistTaskCompleted,
    trackChecklistTaskUncompleted,
    trackChecklistCustomTaskDeleted,
  } = useAnalytics();
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
  const [confettiKey, setConfettiKey] = useState<number | null>(null);
  const confettiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, []);

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
      trackScreen('Checklist');
      if (currentStage !== null && persona) {
        refetch();
      }
    }, [currentStage, persona, refetch, trackScreen])
  );

  // Compute progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercent = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const isLoading = stageLoading || isLoadingProfile || tasksLoading;

  const { hapticsEnabled } = useHapticsPreference();

  // Group tasks by priority
  const tasksByPriority = tasks.reduce(
    (acc, task) => {
      const priority = normalizeChecklistPriority(task.task.priority);
      if (!acc[priority]) {
        acc[priority] = [];
      }
      acc[priority].push(task);
      return acc;
    },
    {} as Record<Priority, typeof tasks>
  );

  const handleTaskPress = (task: UserTaskWithDetails) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTask(null);
  };

  const handleDragStart = useCallback(() => {
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [hapticsEnabled]);

  const handleReorder = useCallback(
    async (priority: Priority, reorderedBucket: UserTaskWithDetails[]) => {
      // Optimistic UI update
      setTasks(prev => replacePriorityBucket(prev, priority, reorderedBucket));

      // Persist to Supabase in background
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Missing authenticated user');

        const orderedKeys = reorderedBucket.map(t => getChecklistTaskOrderKey(t));
        await upsertChecklistTaskOrder(user.id, priority, orderedKeys);
      } catch (err) {
        console.error('Failed to persist checklist order:', err);
        refetch();
      }
    },
    [refetch, setTasks]
  );

  const handleLearnHow = () => {
    if (!selectedTask?.task) {
      handleCloseModal();
      return;
    }
    const { linkTab, linkModuleId, linkSubmoduleId } = selectedTask.task;
    handleCloseModal();
    const resolvedTab = linkTab && (TAB_SLUG_ALIASES[linkTab] ?? linkTab);
    if (resolvedTab && TAB_SLUG_TO_ROUTE[resolvedTab]) {
      router.push(TAB_SLUG_TO_ROUTE[resolvedTab] as any);
    } else if (linkSubmoduleId && linkModuleId) {
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

      const taskTitle = selectedTask.task?.task_name || 'Unknown';
      const taskPriority = selectedTask.task?.priority || 'Unknown';
      const taskSource = selectedTask.source === 'custom' ? 'custom' : 'sanity';
      if (newCompletedStatus) {
        trackChecklistTaskCompleted(taskTitle, taskPriority, taskSource);
        handleCloseModal();
        if (confettiTimeoutRef.current) {
          clearTimeout(confettiTimeoutRef.current);
        }
        setConfettiKey(Date.now());
        confettiTimeoutRef.current = setTimeout(() => {
          setConfettiKey(null);
          confettiTimeoutRef.current = null;
        }, 1800);
      } else {
        trackChecklistTaskUncompleted(taskTitle, taskPriority, taskSource);
      }

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
            trackChecklistCustomTaskDeleted();

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
              <Text style={styles.title}>Personalized Checklist</Text>
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
      <TabHeader variant="minimal" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Personalized Checklist</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                router.push('/(tabs)/Checklist/create-custom-item' as any)
              }
              activeOpacity={0.8}
            >
              <MaterialIcons name='add' size={18} color='#111' />
              <Text style={styles.addButtonLabel}>Add</Text>
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

        {CHECKLIST_PRIORITY_ORDER.map(priority => {
          const priorityTasks = tasksByPriority[priority] || [];

          return (
            <ChecklistSection
              key={priority}
              priority={priority}
              tasks={priorityTasks}
              onTaskPress={handleTaskPress}
              onReorder={(reordered) => handleReorder(priority, reordered)}
              onDragStart={handleDragStart}
            />
          );
        })}

        <TouchableOpacity
          style={styles.addOwnRow}
          onPress={() =>
            router.push('/(tabs)/Checklist/create-custom-item' as any)
          }
          activeOpacity={0.7}
        >
          <MaterialIcons name='add-circle-outline' size={22} color='#6B6B6B' />
          <Text style={styles.addOwnRowText}>Add your own item</Text>
        </TouchableOpacity>

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

      {confettiKey !== null && (
        <View pointerEvents='none' style={StyleSheet.absoluteFill}>
          <ConfettiCannon
            key={confettiKey}
            count={120}
            origin={{ x: Dimensions.get('window').width / 2, y: -20 }}
            fadeOut
            autoStart
            explosionSpeed={350}
            fallSpeed={1500}
          />
        </View>
      )}
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
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  addButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: '#000',
  },
  addOwnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  addOwnRowText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B6B6B',
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
