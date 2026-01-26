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
    color: '#FF4E4E',
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
          <Ionicons name={config.icon} size={32} color={config.color} />
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
          style={[styles.timelineLine, { backgroundColor: config.color }]}
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
                  <Ionicons name='checkmark' size={20} color='#FFF' />
                )}
              </TouchableOpacity>
            </View>

            {/* RIGHT COLUMN (Task card) */}
            <View style={styles.rightColumn}>
              <ChecklistItem task={task} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
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
    width: 30,
    height: 30,
    top: -5,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
