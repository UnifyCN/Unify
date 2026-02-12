import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useUserStage } from '@/hooks/onboarding/useUserStage';
import { useChecklistTasks } from '@/hooks/checklist/useChecklistTasks';
import { getOnboardingProfile } from '@/services/onboarding/getOnboardingProfile';
import { setChecklistItemCompletion } from '@/services/checklist/setChecklistItemCompletion';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ChecklistSection } from '@/components/checklist/ChecklistSection';
import { TaskDetailModal } from '@/components/checklist/TaskDetailModal';
import { supabase } from '@/lib/supabase';
import { ChecklistLinkTabSlug, Priority, UserTaskWithDetails } from '@/types/checklist';
import Header from '@/components/Header';

/**
 * Map checklist tab slug to (tabs) route for "Learn how" navigation.
 * Paths must match tab bar in app/(tabs)/_layout.tsx (Tabs.Screen name):
 * - index (Home), Gather (Community), companion, Checklist, Learn.
 */
const TAB_SLUG_TO_ROUTE: Record<ChecklistLinkTabSlug, string> = {
  home: '/(tabs)/index',
  community: '/(tabs)/Gather/gather',
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
    if (!selectedTask || selectedTask.sanity_checklist_id == null) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const newCompletedStatus = !selectedTask.completed;

      // Optimistically update UI (match by sanity_checklist_id; row may not exist when unchecking)
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

      // Update selected task state
      setSelectedTask({
        ...selectedTask,
        completed: newCompletedStatus,
      });

      await setChecklistItemCompletion(
        user.id,
        selectedTask.sanity_checklist_id,
        newCompletedStatus
      );
    } catch (error) {
      console.error('Error updating task completion:', error);
      refetch();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  const stageDescription =
    currentStage !== null
      ? stageDescriptions[currentStage as keyof typeof stageDescriptions]
      : 'Stage Not Set';
  const personaDisplay = persona
    ? (personaDisplayNames[persona as keyof typeof personaDisplayNames] ?? persona)
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
            <Text style={styles.title}>
              Your Personalized Checklist
            </Text>
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
          <Text style={styles.title}>
            Your Personalized Checklist
          </Text>
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
