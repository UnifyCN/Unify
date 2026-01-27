import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { useMutateCreatePost } from '@/hooks/posts/useCreatePost';
import GroupSelectionSheet from './GroupSelectionSheet';
import DestinationToggle from './DestinationToggle';
import { Theme } from '@/constants/Theme';
import BackHeader from '@/components/BackHeader';
import { useToast } from '@/context/ToastContext';
import { Group } from '@/types/groups';

type DestinationType = '4u' | 'group';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  preselectedGroup?: Group | null;
}

const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 2000;

export default function CreatePostModal({
  visible,
  onClose,
  preselectedGroup,
}: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(
    preselectedGroup || null
  );
  const [destination, setDestination] = useState<DestinationType>(
    preselectedGroup ? 'group' : '4u'
  );
  const [showGroupSelector, setShowGroupSelector] = useState(false);

  const router = useRouter();
  const { showToast } = useToast();
  const createPostMutation = useMutateCreatePost();

  // Restore preselectedGroup when modal opens or preselectedGroup changes
  useEffect(() => {
    if (visible) {
      if (preselectedGroup) {
        setSelectedGroup(preselectedGroup);
        setDestination('group');
      } else {
        setSelectedGroup(null);
        setDestination('4u');
      }
    }
  }, [visible, preselectedGroup]);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }

    if (destination === 'group' && !selectedGroup) {
      Alert.alert('Error', 'Please select a group to post to');
      return;
    }

    createPostMutation.mutate(
      {
        title: title.trim(),
        content: content.trim(),
        group_id: destination === '4u' ? null : String(selectedGroup?.id),
      },
      {
        onSuccess: () => {
          const postedToGroup = destination === 'group' && selectedGroup;
          const toastMessage = postedToGroup
            ? `Posted to ${selectedGroup.name}`
            : 'Posted to For You';

          // Store group info before resetting
          const groupToNavigate = selectedGroup;

          // Reset form
          setTitle('');
          setContent('');
          setSelectedGroup(null);
          setDestination('4u');
          setShowGroupSelector(false);

          // Close modal and show toast
          onClose();
          showToast(toastMessage);

          // Navigate to destination
          // Note: "as any" required due to expo-router typed routes limitation
          // where route types are generated at build time
          if (postedToGroup && groupToNavigate) {
            router.push({
              pathname: '/group-detail' as any,
              params: { group: JSON.stringify(groupToNavigate) },
            });
          } else {
            router.push('/(tabs)' as any);
          }
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
    setDestination('4u');
    setShowGroupSelector(false);
    onClose();
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setDestination('group');
    setShowGroupSelector(false);
  };

  const handleDestinationChange = (newDestination: DestinationType) => {
    setDestination(newDestination);
    if (newDestination === '4u') {
      setSelectedGroup(null);
    } else {
      setShowGroupSelector(true);
    }
  };

  const handleClearGroup = () => {
    setSelectedGroup(null);
    setDestination('4u');
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleCancel}
      >
        <BackHeader
          title=""
          backIcon="x"
          onBack={handleCancel}
          rightButton={
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
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          }
        />
        <ScrollView style={styles.container}>
          <DestinationToggle
            destination={destination}
            selectedGroup={selectedGroup}
            onDestinationChange={handleDestinationChange}
            onClearGroup={handleClearGroup}
          />

          {/* Title Input */}
          <View style={styles.titleContainer}>
            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor={Theme.textAlternateGray}
              value={title}
              onChangeText={setTitle}
              multiline
              maxLength={TITLE_MAX_LENGTH}
            />
            <Text
              style={[
                styles.charCount,
                title.length > TITLE_MAX_LENGTH * 0.9 && styles.charCountWarning,
              ]}
            >
              {title.length}/{TITLE_MAX_LENGTH}
            </Text>
          </View>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Content Input */}
          <View style={styles.contentContainer}>
            <TextInput
              style={styles.contentInput}
              placeholder="What's on your mind?"
              placeholderTextColor={Theme.textAlternateGray}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={CONTENT_MAX_LENGTH}
            />
            <Text
              style={[
                styles.charCount,
                content.length > CONTENT_MAX_LENGTH * 0.9 &&
                  styles.charCountWarning,
              ]}
            >
              {content.length}/{CONTENT_MAX_LENGTH}
            </Text>
          </View>
        </ScrollView>
      </Modal>

      <GroupSelectionSheet
        visible={showGroupSelector}
        onClose={() => setShowGroupSelector(false)}
        onGroupSelect={handleGroupSelect}
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
  titleContainer: {
    marginTop: 8,
  },
  titleInput: {
    fontSize: 32,
    fontWeight: '600',
    color: Theme.black,
    paddingTop: 24,
    paddingBottom: 4,
  },
  separator: {
    height: 1,
    backgroundColor: Theme.surfaceGray,
    marginVertical: 16,
  },
  contentContainer: {
    flex: 1,
    minHeight: 200,
  },
  contentInput: {
    fontSize: 16,
    color: Theme.black,
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 150,
  },
  charCount: {
    fontSize: 12,
    color: Theme.textAlternateGray,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 8,
  },
  charCountWarning: {
    color: Theme.primaryGatherRed,
  },
});
