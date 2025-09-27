import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100, // Above the bottom navigation
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
});

export default function CreatePostButton() {
  const handlePress = () => {
    router.navigate('/create-post');
  };

  return (
    <TouchableOpacity style={styles.floatingButton} onPress={handlePress}>
      <Ionicons name="add" size={24} color="white" />
    </TouchableOpacity>
  );
}