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
import Ionicons from '@expo/vector-icons/Ionicons';

interface TaskDetailModalProps {
  visible: boolean;
  task: UserTaskWithDetails | null;
  onClose: () => void;
  onLearnHow: () => void;
  onMarkComplete: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  task,
  onClose,
  onLearnHow,
  onMarkComplete,
}) => {
  if (!task) return null;

  const isCompleted = task.completed;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="clipboard-outline" size={48} color={Theme.primaryGatherRed} />
            </View>

            {/* Task Name */}
            <Text style={styles.taskName}>{task.task.task_name}</Text>

            {/* Task Description */}
            <Text style={styles.taskDescription}>{task.task.task_description}</Text>

            {/* Buttons */}
            <TouchableOpacity
              style={styles.learnButton}
              onPress={onLearnHow}
              activeOpacity={0.8}
            >
              <Text style={styles.learnButtonText}>Learn how</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

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
              <Ionicons
                name="checkmark"
                size={20}
                color={isCompleted ? '#48BB78' : '#48BB78'}
              />
            </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#FED7D7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  taskName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  taskDescription: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  learnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.primaryGatherRed,
    paddingVertical: 16,
    paddingHorizontal: 32,
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
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    gap: 8,
  },
  completeButtonCompleted: {
    backgroundColor: '#C6F6D5',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#48BB78',
  },
  completeButtonTextCompleted: {
    color: '#22543D',
  },
});
