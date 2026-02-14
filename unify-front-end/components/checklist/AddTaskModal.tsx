import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Priority } from '@/types/checklist';
import { Theme } from '@/constants/Theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAddTask: (taskName: string, taskDescription: string, priority: Priority) => void;
}

const PRIORITIES: Priority[] = [
  'Do now',
  'Do soon',
  'Explore and connect',
  'Optional / later',
];

const priorityConfig: Record<Priority, { icon: string; color: string; bgColor: string }> = {
  'Do now': { icon: 'error-outline', color: '#E03B3B', bgColor: '#FBCFCF' },
  'Do soon': { icon: 'schedule', color: '#F47734', bgColor: '#FBE4CF' },
  'Explore and connect': { icon: 'people', color: '#F49E34', bgColor: '#FFEDBD' },
  'Optional / later': { icon: 'pending', color: '#5E8651', bgColor: '#CDE9D2' },
};

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  onAddTask,
}) => {
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('Do soon');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const trimmedName = taskName.trim();
    if (!trimmedName) {
      setError('Task name is required');
      return;
    }
    onAddTask(trimmedName, taskDescription.trim(), selectedPriority);
    handleClose();
  };

  const handleClose = () => {
    setTaskName('');
    setTaskDescription('');
    setSelectedPriority('Do soon');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Pressable
            style={styles.modalContainer}
            onPress={e => e.stopPropagation()}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>Add Custom Task</Text>
                  <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <MaterialIcons name='close' size={24} color='#666' />
                  </TouchableOpacity>
                </View>

                {/* Task Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Task name *</Text>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    value={taskName}
                    onChangeText={text => {
                      setTaskName(text);
                      setError('');
                    }}
                    placeholder='e.g., Apply for SIN number'
                    placeholderTextColor='#999'
                    maxLength={100}
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>

                {/* Task Description Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description (optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={taskDescription}
                    onChangeText={setTaskDescription}
                    placeholder='Add details about this task...'
                    placeholderTextColor='#999'
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                    textAlignVertical='top'
                  />
                </View>

                {/* Priority Picker */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.priorityGrid}>
                    {PRIORITIES.map(priority => {
                      const config = priorityConfig[priority];
                      const isSelected = selectedPriority === priority;
                      return (
                        <TouchableOpacity
                          key={priority}
                          style={[
                            styles.priorityOption,
                            isSelected && { borderColor: config.color, borderWidth: 2 },
                          ]}
                          onPress={() => setSelectedPriority(priority)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.priorityIcon,
                              { backgroundColor: config.bgColor },
                            ]}
                          >
                            <MaterialIcons
                              name={config.icon as any}
                              size={20}
                              color={config.color}
                            />
                          </View>
                          <Text
                            style={[
                              styles.priorityText,
                              isSelected && { fontWeight: '600' },
                            ]}
                            numberOfLines={2}
                          >
                            {priority}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Add Button */}
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAdd}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addButtonText}>Add Task</Text>
                  <MaterialIcons name='add' size={20} color='#fff' />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
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
  keyboardView: {
    width: '100%',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    maxHeight: '90%',
  },
  content: {
    padding: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#E03B3B',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  errorText: {
    color: '#E03B3B',
    fontSize: 12,
    marginTop: 4,
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  priorityOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  priorityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  priorityText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.primaryGatherRed,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
