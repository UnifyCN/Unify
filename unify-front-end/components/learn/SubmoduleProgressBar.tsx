import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface SubmoduleProgressBarProps {
  currentProgress: number;
  totalPages: number;
  submoduleTitle: string;
  submoduleOrder: number;
  onClose: () => void;
  showLabel?: boolean;
}

export default function SubmoduleProgressBar({ 
  currentProgress, 
  totalPages, 
  submoduleTitle,
  submoduleOrder,
  onClose,
  showLabel = true 
}: SubmoduleProgressBarProps) {
  const progressPercentage = totalPages > 0 ? (currentProgress / totalPages) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Header with title and close button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Feather name='x' size={20} color='#374151' />
        </TouchableOpacity>
        <Text style={styles.title}>
          Section {submoduleOrder}: {submoduleTitle}
        </Text>
      </View>
      
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${Math.min(progressPercentage, 100)}%` }
            ]} 
          />
        </View>
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  closeButton: {
    padding: 4,
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginRight: 40, // Offset for the close button
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6B7280',
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
});
