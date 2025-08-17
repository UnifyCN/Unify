import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

const CreatePostModal = ({ open, onClose, onSubmit, isLoading }: CreatePostModalProps) => {
  const [text, setText] = useState('');
  
  const handleClose = () => {
    if (!isLoading) {
      setText('');
      onClose();
    }
  };
  
  const handleSubmit = () => {
    if (text.trim() && !isLoading) {
      onSubmit(text);
      handleClose();
    }
  };

  return (
    <Modal
      visible={open}
      animationType="fade"
      transparent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Loading Overlay */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#1d9bf0" />
              <Text style={styles.loadingText}>Trying to create post...</Text>
            </View>
          )}

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleClose} 
              style={[styles.closeButton, { opacity: isLoading ? 0.5 : 1 }]}
              disabled={isLoading}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleSubmit}
              style={[
                styles.postButton, 
                { opacity: (text.trim() && !isLoading) ? 1 : 0.5 }
              ]}
              disabled={!text.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Text Input Area */}
          <View style={[styles.inputContainer, { opacity: isLoading ? 0.5 : 1 }]}>
            {/* TODO: replace with getting users profile picture  */}
            <View style={styles.avatar}> 
              <View style={styles.avatarPlaceholder} />
            </View>
            
            <TextInput
              style={styles.textInput}
              placeholder="What's happening?"
              placeholderTextColor="#666"
              multiline
              value={text}
              onChangeText={setText}
              autoFocus
              maxLength={280}
              editable={!isLoading}
            />
          </View>

          {/* Character Count */}
          <View style={styles.footer}>
            <Text style={[
              styles.characterCount,
              { color: text.length > 260 ? '#ff0000' : '#666' }
            ]}>
              {text.length}/280
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  closeButton: {
    padding: 8,
  },
  postButton: {
    backgroundColor: '#1d9bf0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    minHeight: 120,
  },
  avatar: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1d9bf0',
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'flex-end',
  },
  characterCount: {
    fontSize: 14,
  },
});

export default CreatePostModal;