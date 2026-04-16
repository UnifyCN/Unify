import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ThemedText } from '@/components/ThemedText';
import { UserTaskWithDetails, Priority } from '@/types/checklist';
import { getChecklistTaskOrderKey } from '@/utils/checklistOrder';
import { ChecklistItem } from './ChecklistItem';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';

interface ChecklistSectionProps {
  priority: Priority;
  tasks: UserTaskWithDetails[];
  onTaskPress?: (task: UserTaskWithDetails) => void;
  onReorder?: (reorderedTasks: UserTaskWithDetails[]) => void;
  onDragStart?: () => void;
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
  onDragStart,
}) => {
  const config = priorityConfig[priority];
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<UserTaskWithDetails>) => {
      return (
        <ScaleDecorator activeScale={1.03}>
          <View style={[styles.row, isActive && styles.rowActive]}>
            <View style={styles.leftColumn}>
              <TouchableOpacity
                onPress={() => !isActive && onTaskPress?.(item)}
                disabled={isActive}
                style={[
                  styles.checkboxCircle,
                  { backgroundColor: '#FFF', borderColor: config.color },
                  item.completed && {
                    backgroundColor: config.color,
                    borderColor: config.color,
                  },
                ]}
                activeOpacity={0.7}
              >
                {item.completed && (
                  <MaterialIcons name='check' size={20} color='#FFF' />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.centerColumn}>
              <ChecklistItem task={item} onPress={() => onTaskPress?.(item)} />
            </View>

            <TouchableOpacity
              style={styles.dragHandle}
              accessibilityRole="button"
              accessibilityLabel={`Reorder ${item.task.task_name}`}
              accessibilityHint="Long press and drag to change this item's order within the section"
              onLongPress={() => {
                onDragStart?.();
                drag();
              }}
              delayLongPress={150}
              activeOpacity={0.6}
            >
              <MaterialIcons name='drag-indicator' size={24} color='#BDBDBD' />
            </TouchableOpacity>
          </View>
        </ScaleDecorator>
      );
    },
    [config.color, onDragStart, onTaskPress],
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
        <DraggableFlatList
          data={tasks}
          keyExtractor={getChecklistTaskOrderKey}
          renderItem={renderItem}
          onDragEnd={({ data }) => onReorder?.(data)}
          scrollEnabled={false}
          containerStyle={styles.listContainer}
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
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  rowActive: {
    opacity: 0.95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  leftColumn: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerColumn: {
    flex: 1,
  },
  dragHandle: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
  listContainer: {
    overflow: 'visible',
  },
});
