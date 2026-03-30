import React from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import {
  NestableDraggableFlatList,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { ThemedText } from '@/components/ThemedText';
import { UserTaskWithDetails, Priority } from '@/types/checklist';
import { ChecklistItem } from './ChecklistItem';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getChecklistTaskOrderKey } from '@/utils/checklistOrder';

interface ChecklistSectionProps {
  priority: Priority;
  tasks: UserTaskWithDetails[];
  onTaskPress?: (task: UserTaskWithDetails) => void;
  onReorder: (priority: Priority, data: UserTaskWithDetails[]) => void;
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
    icon: 'people' as const,
    color: '#F49E34',
    backgroundColor: '#FFEDBD',
  },
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
  onReorder,
}) => {
  const config = priorityConfig[priority];
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  const renderItem = ({
    item: task,
    drag,
    isActive,
  }: RenderItemParams<UserTaskWithDetails>) => (
    <View
      style={[styles.row, isActive && styles.rowActive]}
      collapsable={false}
    >
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

      <Pressable
        onLongPress={drag}
        delayLongPress={200}
        style={({ pressed }) => [
          styles.dragHandle,
          pressed && styles.dragHandlePressed,
        ]}
        accessibilityRole='button'
        accessibilityLabel='Reorder task'
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <MaterialIcons name='menu' size={22} color='#8E8E93' />
      </Pressable>

      <View style={styles.rightColumn}>
        <ChecklistItem task={task} onPress={() => onTaskPress?.(task)} />
      </View>
    </View>
  );

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
        <View
          style={[
            styles.timelineLine,
            { backgroundColor: config.backgroundColor },
          ]}
        />
        <NestableDraggableFlatList
          data={tasks}
          keyExtractor={item => getChecklistTaskOrderKey(item)}
          renderItem={renderItem}
          scrollEnabled={false}
          activationDistance={1000}
          onDragEnd={({ data }) => onReorder(priority, data)}
          containerStyle={styles.draggableList}
        />
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
  draggableList: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  rowActive: {
    opacity: 0.92,
  },
  leftColumn: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dragHandle: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginRight: 2,
  },
  dragHandlePressed: {
    opacity: 0.6,
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
