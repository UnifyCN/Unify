import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { UserTaskWithDetails, Priority } from '@/types/checklist';
import { ChecklistItem } from './ChecklistItem';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ChecklistSectionProps {
  priority: Priority;
  tasks: UserTaskWithDetails[];
  onTaskPress?: (task: UserTaskWithDetails) => void;
}

const priorityConfig = {
  'Do now': {
    icon: 'alert-circle' as const,
    color: '#E53E3E',
    backgroundColor: '#FED7D7',
  },
  'Do soon': {
    icon: 'time' as const,
    color: '#DD6B20',
    backgroundColor: '#FEEBC8',
  },
  'Explore & connect': {
    icon: 'people' as const,
    color: '#805AD5',
    backgroundColor: '#E9D8FD',
  },
  'Optional / later': {
    icon: 'calendar' as const,
    color: '#3182CE',
    backgroundColor: '#BEE3F8',
  },
};

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  priority,
  tasks,
  onTaskPress,
}) => {
  const config = priorityConfig[priority];
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: config.backgroundColor },
          ]}
        >
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>
        <View style={styles.headerText}>
          <ThemedText style={styles.priority}>{priority}</ThemedText>
          <ThemedText style={styles.count}>
            {completedCount}/{totalCount} complete
          </ThemedText>
        </View>
      </View>
      <View style={styles.timeline}>
        {tasks.map((task, index) => (
          <View key={task.user_task_id} style={styles.taskWrapper}>
            {index < tasks.length - 1 && <View style={styles.timelineLine} />}
            <ChecklistItem task={task} onPress={() => onTaskPress?.(task)} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  priority: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  count: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  timeline: {
    paddingLeft: 24,
  },
  taskWrapper: {
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: -12,
    top: 24,
    bottom: -12,
    width: 2,
    backgroundColor: '#E2E8F0',
  },
});
