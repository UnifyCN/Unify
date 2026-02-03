import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { UserTaskWithDetails, Priority } from '@/types/checklist';
import { ChecklistItem } from './ChecklistItem';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface ChecklistSectionProps {
  priority: Priority;
  tasks: UserTaskWithDetails[];
  onTaskPress?: (task: UserTaskWithDetails) => void;
}

const priorityConfig = {
  'Do now': {
    icon: 'error-outline' as const,
    color: '#E03B3B',
    backgroundColor: '#FBCFCF',
  },
  'Do soon': {
    icon: 'schedule' as const,
    color: '#F47734',
    backgroundColor: '#FBE4CF',
  },
  'Explore and connect': {
  'Explore & connect': {
    icon: 'people' as const,
    color: '#F49E34',
    backgroundColor: '#FFEDBD',
  },
  'Optional / later': {
    icon: 'pending' as const,
    color: '#5E8651',
    backgroundColor: '#CDE9D2',
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
          <MaterialIcons name={config.icon} size={32} color={config.color} />
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
          style={[styles.timelineLine, { backgroundColor: config.backgroundColor }]}
        />
        {tasks.map((task, index) => (
          <View key={task.sanity_checklist_id || task.user_task_id || index} style={styles.row}>
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
                  <MaterialIcons name='check' size={20} color='#FFF' />
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
    marginBottom: 10,
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
    left: 24,
    top: 0,
    bottom: 30,
    width: 1,
    backgroundColor: '#E2E8F0',
    zIndex: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  leftColumn: {
    width: 36,
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
    top: -6,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
