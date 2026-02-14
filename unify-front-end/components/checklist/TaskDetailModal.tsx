import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native';
import { UserTaskWithDetails, CustomUserTask } from '@/types/checklist';
import { Theme } from '@/constants/Theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface TaskDetailModalProps {
  visible: boolean;
  task: UserTaskWithDetails | CustomUserTask | null;
  isCustomTask?: boolean;
  onClose: () => void;
  onLearnHow: () => void;
  onMarkComplete: () => void;
  onDelete?: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  task,
  isCustomTask = false,
  onClose,
  onLearnHow,
  onMarkComplete,
  onDelete,
}) => {
  if (!task) return null;

  // For custom tasks, use the direct properties; for regular tasks, access via task.task
  const isCompleted = isCustomTask 
    ? (task as CustomUserTask).completed
    : (task as UserTaskWithDetails).completed;
  
  const taskName = isCustomTask
    ? (task as CustomUserTask).task_name
    : (task as UserTaskWithDetails).task.task_name;
  
  const taskDescription = isCustomTask
    ? (task as CustomUserTask).task_description || ''
    : (task as UserTaskWithDetails).task.task_description;

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={styles.modalContainer}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={isCustomTask ? 'add-task' : 'assignment'}
                size={28}
                color={Theme.primaryGatherRed}
              />
            </View>

            {/* Task Name */}
            <Text style={styles.taskName}>{taskName}</Text>

            {/* Task Description */}
            <Text style={styles.taskDescription}>
              {taskDescription}
            </Text>

            {/* Learn How button - only for non-custom tasks */}
            {!isCustomTask && (
              <TouchableOpacity
                style={styles.learnButton}
                onPress={onLearnHow}
                activeOpacity={0.8}
              >
                <Text style={styles.learnButtonText}>Learn how</Text>
                <MaterialIcons name='arrow-right-alt' size={20} color='#fff' />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.completeButton,
                isCompleted && styles.completeButtonCompleted,
              ]}
              onPress={onMarkComplete}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.completeButtonText,
                  isCompleted && styles.completeButtonTextCompleted,
                ]}
              >
                {isCompleted ? 'Completed' : 'Mark as complete'}
              </Text>
              <MaterialIcons
                name='check'
                size={20}
                color={isCompleted ? '#48BB78' : '#48BB78'}
              />
            </TouchableOpacity>

            {/* Delete button - only for custom tasks */}
            {isCustomTask && onDelete && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                activeOpacity={0.8}
              >
                <MaterialIcons name='delete-outline' size={20} color='#E03B3B' />
                <Text style={styles.deleteButtonText}>Delete task</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    width: '100%',
  },
  content: {
    padding: 32,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FBCFCF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  taskName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  taskDescription: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: 24,
  },
  learnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E03B3B',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
    gap: 8,
  },
  learnButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F7ED',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
    gap: 8,
  },
  completeButtonCompleted: {
    backgroundColor: '#E2F6E2',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4E7E4C',
  },
  completeButtonTextCompleted: {
    color: '#22543D',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E03B3B',
  },
});
