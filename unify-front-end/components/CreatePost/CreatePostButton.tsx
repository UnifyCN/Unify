import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CreatePostModal from './CreatePostModal';
import { useMutateCreatePost } from '@/hooks/posts/useCreatePost';

export const CreatePostButton = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { mutate: createPostMutation, isPending } = useMutateCreatePost();

  const onSubmit = (text: string) => {
    createPostMutation(text);
  }

  const openChat = () => {
    setIsModalVisible(true);
  };

  const closeChat = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.floatingButton]}
        onPress={openChat}
        activeOpacity={0.8}
      >
        <Ionicons name='add' size={24} color='#fff' />
      </TouchableOpacity>

      <CreatePostModal open={isModalVisible} onClose={closeChat} onSubmit={onSubmit} isLoading={isPending} />
    </>
  );
};

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

export default CreatePostButton