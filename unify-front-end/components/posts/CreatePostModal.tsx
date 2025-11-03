import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useMutateCreatePost } from '@/hooks/posts/useCreatePost';
import Feather from '@expo/vector-icons/Feather';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import PostSuccessModal from './PostSuccessModal';
import SelectGroupModal from './SelectGroupModal';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreatePostModal({
  visible,
  onClose,
}: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const createPostMutation = useMutateCreatePost();

  const handleSubmit = () => {
    if (!title.trim() || !content.trim() || !selectedGroup) {
      Alert.alert('Error', 'Please fill in all fields and select a group');
      return;
    }

    createPostMutation.mutate(
      {
        title: title.trim(),
        content: content.trim(),
        group_id: selectedGroup.id,
      },
      {
        onSuccess: () => {
          // Reset form
          setTitle('');
          setContent('');
          setSelectedGroup(null);
          // Close create post modal first, then show success
          onClose();
          setShowSuccessModal(true);
        },
        onError: _ => {
          Alert.alert('Error', 'Failed to create post. Please try again.');
        },
      }
    );
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setSelectedGroup(null);
    onClose();
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
  };

  const handleGroupSelect = (group: any) => {
    setSelectedGroup(group);
    setShowGroupSelector(false);
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleCancel}
      >
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleCancel}
            >
              <Feather name='x' size={24} color='black' />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.postButton,
                (!title.trim() || !content.trim() || !selectedGroup) &&
                  styles.disabledButton,
              ]}
              disabled={
                !title.trim() ||
                !content.trim() ||
                !selectedGroup ||
                createPostMutation.isPending
              }
            >
              {createPostMutation.isPending ? (
                <ActivityIndicator size='small' color='white' />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.groupSelector}
            onPress={() => setShowGroupSelector(true)}
          >
            <View style={styles.groupSelectorContent}>
              {selectedGroup ? (
                <View style={styles.selectedGroupInfo}>
                  <SimpleLineIcons name='magnifier' size={18} color='white' />
                  <Text style={styles.groupSelectorText}>
                    {selectedGroup.name}
                  </Text>
                  <View style={styles.placeholder}></View>
                </View>
              ) : (
                <View style={styles.selectedGroupInfo}>
                  <SimpleLineIcons name='magnifier' size={18} color='white' />
                  <Text style={styles.groupSelectorText}>Select a group</Text>
                  <View style={styles.placeholder}></View>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TextInput
            style={styles.titleInput}
            placeholder='Title'
            placeholderTextColor='#a5a5a5'
            value={title}
            onChangeText={setTitle}
            multiline
          />

          <TextInput
            style={styles.contentInput}
            placeholder='Body text'
            placeholderTextColor='#a5a5a5'
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical='top'
          />
        </ScrollView>
      </Modal>

      {/* Use the separate SelectGroupModal component */}
      <SelectGroupModal
        visible={showGroupSelector}
        onClose={() => setShowGroupSelector(false)}
        onGroupSelect={handleGroupSelect}
      />

      <PostSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 60,
  },
  postButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 7,
    paddingHorizontal: 24,
    borderRadius: 15,
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
  },
  groupSelector: {
    alignSelf: 'flex-start',
    borderRadius: 15,
    backgroundColor: '#8F8F8F',
    marginVertical: 16,
  },
  groupSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  groupSelectorText: {
    fontSize: 16,
    color: '#FFF',
  },
  selectedGroupInfo: {
    flexDirection: 'row',
    gap: 15,
  },
  placeholder: {
    width: 16,
  },
  titleInput: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
    paddingTop: 18,
  },
  contentInput: {
    paddingTop: 12,
    fontSize: 16,
  },
});
