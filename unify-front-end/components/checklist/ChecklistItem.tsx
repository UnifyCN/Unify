import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { UserTaskWithDetails } from '@/types/checklist';

interface ChecklistItemProps {
  task: UserTaskWithDetails;
  onPress?: () => void;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  task,
  onPress,
}) => {
  const isCompleted = task.completed;
  const taskName = task.task.task_name?.trim() ?? '';
  const taskDescription = task.task.task_description?.trim() ?? '';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ThemedText
        style={[
          styles.taskName,
          isCompleted && { color: styles.taskDescription.color },
        ]}
      >
        {taskName}
      </ThemedText>
      <ThemedText style={styles.taskDescription}>
        {taskDescription}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6D5D5',
  },
  taskName: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500',
    color: '#000',
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: '#727272',
  },
});
