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
        {task.task.task_name}
      </ThemedText>
      <ThemedText style={styles.taskDescription}>
        {task.task.task_description}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6D5D5',
  },
  taskName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  taskDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: '#727272',
  },
});
