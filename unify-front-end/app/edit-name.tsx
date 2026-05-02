import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import BackHeader from '@/components/BackHeader';
import { Theme } from '@/constants/Theme';
import { useCurrentUser } from '@/context/UserContext';
import { updateUsername } from '@/services/users/updateUsername';
import { useQueryClient } from '@tanstack/react-query';

export default function EditNamePage() {
  const router = useRouter();
  const { t } = useTranslation();
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
      Alert.alert(t('common.error'), t('editName.emptyError'));
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
        Alert.alert(t('editName.successTitle'), t('editName.successMessage'), [
          {
            text: t('common.ok'),
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert(t('common.error'), result.error || t('editName.failedUpdate'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('editName.failedUpdate'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setUsername('');
  };

  return (
    <View style={styles.container}>
      <BackHeader title={t('editName.title')} onBack={() => router.back()} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps='handled'
      >
        <Text style={styles.label}>{t('editName.title')}</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder={t('editName.placeholder')}
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
        <Text style={styles.characterCount}>{username.length}/20</Text>
        <Text style={styles.description}>
          {t('editName.validationError')}
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? t('common.saving') : t('common.save')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
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
