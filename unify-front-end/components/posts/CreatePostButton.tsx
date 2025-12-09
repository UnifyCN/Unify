import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import CreatePostIcon from '@/assets/images/create-post.svg';
import CreatePostModal from './CreatePostModal';
import { Theme } from '@/constants/Theme';

interface CreatePostButtonProps {
  preselectedGroup?: any;
}

export default function CreatePostButton({
  preselectedGroup,
}: CreatePostButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handlePress = () => {
    setShowModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.floatingButton} onPress={handlePress}>
        <CreatePostIcon width={27} height={27} />
      </TouchableOpacity>

      <CreatePostModal
        visible={showModal}
        onClose={handleCloseCreateModal}
        preselectedGroup={preselectedGroup}
      />
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20, // Above the bottom navigation
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.primaryGatherRed,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
