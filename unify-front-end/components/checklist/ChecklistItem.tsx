import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { UserTaskWithDetails, CustomUserTask, ChecklistTaskDetails } from '@/types/checklist';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface ChecklistItemProps {
  task: UserTaskWithDetails | { completed: boolean; task: ChecklistTaskDetails };
  onPress?: () => void;
  isCustom?: boolean;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  task,
  onPress,
  isCustom = false,
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
      <View style={styles.content}>
        <ThemedText
          style={[
            styles.taskName,
            isCompleted && { color: '#727272', textDecorationLine: 'line-through' },
          ]}
        >
          {taskName}
        </ThemedText>
        <ThemedText style={styles.taskDescription}>{taskDescription}</ThemedText>
        {isCustom && (
          <View style={styles.customBadge}>
            <MaterialIcons name='add' size={10} color='#666' />
            <Text style={styles.customBadgeText}>Custom</Text>
          </View>
        )}
      </View>
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
  content: {
    gap: 2,
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
  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  customBadgeText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
});
