import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  uploadProfilePicture,
  deleteProfilePicture,
} from '@/services/s3/uploadProfilePicture';
import { updateProfilePicture } from '@/services/users/updateProfilePicture';
import { useQueryClient } from '@tanstack/react-query';

interface ProfilePictureUploadProps {
  currentPictureUrl?: string;
  userId: string;
}

export const ProfilePictureUpload = ({
  currentPictureUrl,
  userId,
}: ProfilePictureUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const queryClient = useQueryClient();
  const slideAnim = useRef(new Animated.Value(300)).current;

  const invalidateAllQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['userInfo', userId] });
    queryClient.invalidateQueries({ queryKey: ['feed', 'forYou'] });
    queryClient.invalidateQueries({ queryKey: ['feed', 'following'] });
    queryClient.invalidateQueries({ queryKey: ['feed', 'groups'] });
    queryClient.invalidateQueries({ queryKey: ['userPosts', userId] });
    queryClient.invalidateQueries({ queryKey: ['feed', 'savedPosts'] });
  };

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible, slideAnim]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your photo library to upload a profile picture.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploading(true);
    try {
      // For React Native, we need to read the file as base64
      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Upload to S3
      const uploadResult = await uploadProfilePicture(buffer, userId);

      if (uploadResult.success && uploadResult.url) {
        // Update the database
        const updateResult = await updateProfilePicture(uploadResult.url);

        if (updateResult.success) {
          // Delete old profile picture from S3 if it exists
          if (currentPictureUrl) {
            try {
              await deleteProfilePicture(currentPictureUrl);
            } catch (error) {
              console.warn('Failed to delete old profile picture:', error);
              // Don't show error to user, just log it
            }
          }

          // Invalidate and refetch user info and all post feeds
          invalidateAllQueries();
          Alert.alert('Success', 'Profile picture updated successfully!');
        } else {
          Alert.alert(
            'Error',
            updateResult.error || 'Failed to update profile picture'
          );
        }
      } else {
        Alert.alert('Error', uploadResult.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removePicture = async () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsUploading(true);
            try {
              // Delete from S3 if there's a current picture
              if (currentPictureUrl) {
                await deleteProfilePicture(currentPictureUrl);
              }

              // Update the database
              const updateResult = await updateProfilePicture(null);

              if (updateResult.success) {
                // Invalidate and refetch user info and all post feeds
                invalidateAllQueries();
                Alert.alert('Success', 'Profile picture removed successfully!');
              } else {
                Alert.alert(
                  'Error',
                  updateResult.error || 'Failed to remove profile picture'
                );
              }
            } catch (error) {
              console.error('Error removing picture:', error);
              Alert.alert(
                'Error',
                'Failed to remove profile picture. Please try again.'
              );
            } finally {
              setIsUploading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Modal
        animationType='fade'
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Animated.View
              style={[
                styles.modalContent,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Profile Picture</Text>
              </View>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setModalVisible(false);
                  pickImage();
                }}
                disabled={isUploading}
              >
                <Feather
                  name='image'
                  size={20}
                  color='#000'
                  style={styles.optionIcon}
                />
                <Text style={styles.modalOptionText}>Choose from library</Text>
              </TouchableOpacity>

              {currentPictureUrl && (
                <TouchableOpacity
                  style={[styles.modalOption, styles.removeOption]}
                  onPress={() => {
                    setModalVisible(false);
                    removePicture();
                  }}
                  disabled={isUploading}
                >
                  <Feather
                    name='trash-2'
                    size={20}
                    color='#FF3B30'
                    style={styles.optionIcon}
                  />
                  <Text style={styles.removeOptionText}>
                    Remove current picture
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.infoMessage}>
                <Text style={styles.infoText}>
                  Your profile picture is visible to everyone on the app.
                </Text>
              </View>
            </Animated.View>
          </View>
        </Pressable>
      </Modal>

      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => setModalVisible(true)}
        disabled={isUploading}
      >
        {isUploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color='#fff' size='small' />
          </View>
        )}
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionIcon: {
    marginRight: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  removeOption: {
    borderBottomWidth: 0,
  },
  removeOptionText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
    flex: 1,
  },
  infoMessage: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#000',
  },
  avatarButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 46.5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 46.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
