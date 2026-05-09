import React from 'react';
import { StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
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

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ThemedText
        style={[styles.taskName, isCompleted && styles.taskNameCompleted]}
        numberOfLines={2}
        ellipsizeMode='tail'
      >
        {taskName}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6D5D5',
    minHeight: 52,
    justifyContent: 'center',
  },
  taskName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    color: '#0F172A',
  },
  taskNameCompleted: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
});
