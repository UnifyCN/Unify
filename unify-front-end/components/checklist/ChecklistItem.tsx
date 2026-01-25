import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { UserTaskWithDetails, Priority } from '@/types/checklist';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ChecklistItemProps {
  task: UserTaskWithDetails;
  onPress?: () => void;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({ task, onPress }) => {
  const isCompleted = task.completed;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.checkboxContainer}>
        <View
          style={[
            styles.checkbox,
            isCompleted && styles.checkboxCompleted,
          ]}
        >
          {isCompleted && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </View>
      </View>
      <View style={styles.contentContainer}>
        <ThemedText style={styles.taskName}>{task.task.task_name}</ThemedText>
        <ThemedText style={styles.taskDescription}>
          {task.task.task_description}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  checkboxContainer: {
    marginRight: 12,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E53E3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#48BB78',
    borderColor: '#48BB78',
  },
  contentContainer: {
    flex: 1,
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
