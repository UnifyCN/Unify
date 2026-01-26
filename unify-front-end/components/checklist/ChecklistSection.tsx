import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
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
    backgroundColor: '#fbcfcf',
    lineColor: '#fbcfcf',
  },
  'Do soon': {
    icon: 'time' as const,
    color: '#DD6B20',
    backgroundColor: '#fbe4cf',
    lineColor: '#f8ae81',
  },
  'Explore & connect': {
    icon: 'people' as const,
    color: '#f49e34',
    backgroundColor: '#ffedbd',
    lineColor: '#ffe49b',
  },
  'Optional / later': {
    icon: 'calendar' as const,
    color: '#48BB78',
    backgroundColor: '#cde9d2',
    lineColor: '#cde9d2',
  },
};

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  priority,
  tasks,
  onTaskPress,
}) => {
  const config = priorityConfig[priority];
  const completedCount = tasks.filter(t => t.completed).length;
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
          <Ionicons name={config.icon} size={34} color={config.color} />
        </View>
        <View style={styles.headerText}>
          <ThemedText style={styles.priority}>{priority}</ThemedText>
          <ThemedText style={styles.count}>
            {completedCount}/{totalCount} complete
          </ThemedText>
        </View>
      </View>
      <View style={styles.timeline}>
        {/* Line going through checkbox circles */}
        <View
          style={[styles.timelineLine, { backgroundColor: config.lineColor }]}
        />
        {tasks.map((task, index) => (
          <View key={task.user_task_id} style={styles.row}>
            {/* LEFT COLUMN (Checkbox) */}
            <View style={styles.leftColumn}>
              <TouchableOpacity
                onPress={() => onTaskPress?.(task)}
                style={[
                  styles.checkboxCircle,
                  { backgroundColor: '#FFF', borderColor: config.color },
                  task.completed && {
                    backgroundColor: config.color,
                    borderColor: config.color,
                  },
                ]}
                activeOpacity={0.7}
              >
                {task.completed && (
                  <Ionicons name='checkmark' size={16} color='#FFF' />
                )}
              </TouchableOpacity>
            </View>

            {/* RIGHT COLUMN (Task card) */}
            <View style={styles.rightColumn}>
              <ChecklistItem task={task} onPress={() => onTaskPress?.(task)} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  priority: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  count: {
    fontSize: 14,
    color: '#000',
    marginTop: 2,
  },
  timeline: {
    paddingLeft: 6,
  },
  timelineLine: {
    position: 'absolute',
    left: 26,
    top: 0,
    bottom: 30,
    width: 0.5,
    backgroundColor: '#E2E8F0',
    zIndex: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  leftColumn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rightColumn: {
    flex: 1,
  },
  checkboxCircle: {
    width: 26,
    height: 26,
    top: -5,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
