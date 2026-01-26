import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import BackHeader from '@/components/BackHeader';
import { Theme } from '@/constants/Theme';
import { useCurrentUser } from '@/context/UserContext';
import { updateUsername } from '@/services/users/updateUsername';
import { useQueryClient } from '@tanstack/react-query';

export default function EditNamePage() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState(currentUser?.username || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.username) {
      setUsername(currentUser.username);
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    if (username === currentUser?.username) {
      router.back();
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateUsername(username.trim());

      if (result.success) {
        // Invalidate user info queries to refresh the context
        queryClient.invalidateQueries({ queryKey: ['userInfo'] });
        Alert.alert('Success', 'Username updated successfully!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to update username');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update username. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setUsername('');
  };

  return (
    <View style={styles.container}>
      <BackHeader title='Name' onBack={() => router.back()} />
      <View style={styles.content}>
        <Text style={styles.label}>Name</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder='Enter your name'
            placeholderTextColor='#999'
            autoFocus
            maxLength={20}
            autoCapitalize='none'
            autoCorrect={false}
          />
          {username.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name='x' size={16} color={Theme.black} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.characterCount}>
          {username.length}/20
        </Text>
        <Text style={styles.description}>
          Only letters, numbers, and spaces allowed.
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  label: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.black,
    marginBottom: 16,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderColor: Theme.black,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 20,
    fontSize: 14,
    color: Theme.black,
  },
  clearButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  characterCount: {
    fontSize: 12,
    color: Theme.textPostTime,
    marginTop: 8,
    textAlign: 'left',
  },
  description: {
    fontSize: 12,
    color: Theme.textPostTime,
    marginTop: 4,
    marginBottom: 4,
  },
  saveButton: {
    marginTop: 30,
    backgroundColor: Theme.primaryGatherRed,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.white,
  },
});
