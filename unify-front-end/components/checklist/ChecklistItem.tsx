import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { UserTaskWithDetails, Priority } from '@/types/checklist';
import Ionicons from '@expo/vector-icons/Ionicons';

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
    <View style={styles.container}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  taskDescription: {
    fontSize: 14,
    color: '#718096',
  },
});
