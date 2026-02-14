import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CustomUserTask } from '@/types/checklist';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface CustomTaskItemProps {
  task: CustomUserTask;
  onPress: (task: CustomUserTask) => void;
}

export const CustomTaskItem: React.FC<CustomTaskItemProps> = ({
  task,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(task)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.taskName,
            task.completed && styles.taskNameCompleted,
          ]}
          numberOfLines={2}
        >
          {task.task_name}
        </Text>
        {task.task_description ? (
          <Text style={styles.taskDescription} numberOfLines={2}>
            {task.task_description}
          </Text>
        ) : null}
        <View style={styles.badge}>
          <MaterialIcons name='add' size={12} color='#666' />
          <Text style={styles.badgeText}>Custom</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  content: {
    gap: 4,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#212529',
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#6C757D',
  },
  taskDescription: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
});
