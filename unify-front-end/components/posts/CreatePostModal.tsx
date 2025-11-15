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
import PostSuccessModal from './PostSuccessModal';
import SelectGroupModal from './SelectGroupModal';
import { Theme } from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchButton from '@/components/SearchButton';

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

  const insets = useSafeAreaInsets();
  const createPostMutation = useMutateCreatePost();

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }

    createPostMutation.mutate(
      {
        title: title.trim(),
        content: content.trim(),
        group_id: selectedGroup?.id,
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
        animationType='none'
        statusBarTranslucent
        onRequestClose={handleCancel}
      >
        <ScrollView style={styles.container}>
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity onPress={handleCancel}>
              <Feather name='x' size={24} color='black' />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.postButton,
                (!title.trim() || !content.trim()) && styles.disabledButton,
              ]}
              disabled={
                !title.trim() || !content.trim() || createPostMutation.isPending
              }
            >
              {createPostMutation.isPending ? (
                <ActivityIndicator size='small' color='white' />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          <SearchButton
            placeholder={
              selectedGroup ? selectedGroup.name : 'Select a group (optional)'
            }
            onPress={() => setShowGroupSelector(true)}
            style={styles.groupSelector}
            placeholderStyle={
              selectedGroup ? styles.groupSelectorText : styles.groupBlankText
            }
            iconSize={20}
          />

          <TextInput
            style={styles.titleInput}
            placeholder='Title'
            placeholderTextColor={Theme.black}
            value={title}
            onChangeText={setTitle}
            multiline
          />

          <TextInput
            style={styles.contentInput}
            placeholder='Body text'
            placeholderTextColor={Theme.black}
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
  },
  postButton: {
    backgroundColor: Theme.primaryGatherRed,
    paddingVertical: 9,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  disabledButton: {
    backgroundColor: Theme.disabledGatherRed,
  },
  postButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '400',
  },
  groupSelector: {
    marginVertical: 15,
  },
  groupSelectorSelected: {
    alignSelf: 'flex-start',
  },
  groupBlankText: {
    fontSize: 14,
    color: Theme.textAlternateGray,
  },
  groupSelectorText: {
    fontSize: 14,
    color: Theme.black,
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
