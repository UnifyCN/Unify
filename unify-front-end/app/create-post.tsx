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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutateCreatePost } from '@/hooks/posts/useCreatePost';
import Feather from '@expo/vector-icons/Feather';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';

export default function CreatePostScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Get selected group from route params
  const params = useLocalSearchParams();
  const selectedGroup = params.selectedGroup
    ? JSON.parse(params.selectedGroup as string)
    : null;

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
          Alert.alert('Success', 'Post created successfully!', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: error => {
          Alert.alert('Error', 'Failed to create post. Please try again.');
        },
      }
    );
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSelectGroup = () => {
    router.push('/select-group');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
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
        onPress={handleSelectGroup}
      >
        <View style={styles.groupSelectorContent}>
          {selectedGroup ? (
            <View style={styles.selectedGroupInfo}>
              <SimpleLineIcons name='magnifier' size={18} color='white' />
              <Text style={styles.groupSelectorText}>{selectedGroup.name}</Text>
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
        value={title}
        onChangeText={setTitle}
        multiline
      />

      <TextInput
        style={styles.contentInput}
        placeholder='Body text'
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical='top'
      />
    </ScrollView>
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
    paddingVertical: 16,
    marginTop: 30,
  },
  cancelButton: {
    paddingVertical: 15,
    paddingHorizontal: 15,
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
    marginBottom: 16,
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
    width: 16, // Same width as cancel button for centering
  },
  titleInput: {
    fontSize: 32,
    fontWeight: 600,
    color: '#000',
    paddingTop: 18,
  },
  contentInput: {
    paddingTop: 12,
    fontSize: 16,
  },
});
