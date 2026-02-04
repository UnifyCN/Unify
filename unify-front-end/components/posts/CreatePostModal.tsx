import React from 'react';
import { Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import CreatePostForm from './CreatePostForm';
import { Group } from '@/types/groups';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  preselectedGroup?: Group | null;
}

export default function CreatePostModal({
  visible,
  onClose,
  preselectedGroup,
}: CreatePostModalProps) {
  const router = useRouter();

  return (
    <Modal
      visible={visible}
      animationType='none'
      statusBarTranslucent
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <CreatePostForm
        preselectedGroup={preselectedGroup}
        onCancel={onClose}
        onSuccessNavigate={({ postedToGroup, group }) => {
          onClose();
          if (postedToGroup && group) {
            router.replace({
              pathname: '/group-detail' as any,
              params: { group: JSON.stringify(group) },
            });
          } else {
            router.replace('/(tabs)' as any);
          }
        }}
      />
    </Modal>
  );
}
