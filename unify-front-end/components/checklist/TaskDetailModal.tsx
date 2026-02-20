import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { UserTaskWithDetails } from '@/types/checklist';
import { Theme } from '@/constants/Theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface TaskDetailModalProps {
  visible: boolean;
  task: UserTaskWithDetails | null;
  onClose: () => void;
  onLearnHow: () => void;
  onMarkComplete: () => void;
  isCustomTask?: boolean;
  onDeleteCustomTask?: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  task,
  onClose,
  onLearnHow,
  onMarkComplete,
  isCustomTask = false,
  onDeleteCustomTask,
}) => {
  if (!task) return null;

  const isCompleted = task.completed;

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
                name='assignment'
                size={28}
                color={Theme.primaryGatherRed}
              />
            </View>

            {/* Task Name */}
            <Text style={styles.taskName}>{task.task.task_name}</Text>

            {/* Task Description (longer when available, else short) */}
            <Text style={styles.taskDescription}>
              {task.task.longer_description?.trim() ||
                task.task.task_description}
            </Text>

            {/* Buttons */}
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

            {isCustomTask && onDeleteCustomTask && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={onDeleteCustomTask}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
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
    alignSelf: 'center',
    paddingVertical: 8,
    marginTop: 2,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#B42318',
  },
});
