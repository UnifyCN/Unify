import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useMutateReport } from '@/hooks/posts/useMutateReport';
import { useToast } from '@/context/ToastContext';
import BackHeader from '@/components/BackHeader';

const MIN_LENGTH = 5;
const MAX_LENGTH = 500;

export default function ReportScreen() {
  const { postId, userId, type = 'post' } = useLocalSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const mutation = useMutateReport();

  const [message, setMessage] = useState('');

  const submitting = mutation.isPending;
  const isPost = type === 'post';

  const title = isPost ? 'Report Post' : 'Report User';
  const subtitle = isPost
    ? 'Tell us why you’re reporting this post. This message is private and will only be visible to moderators.'
    : 'Tell us why you’re reporting this user. This message is private and will only be visible to moderators.';
  const placeholder = isPost
    ? "Write why you're reporting this post..."
    : "Write why you're reporting this user...";

  const handleSubmit = () => {
    const trimmed = (message || '').trim().slice(0, MAX_LENGTH);
    if (trimmed.length < MIN_LENGTH) {
      Alert.alert('Please provide a short reason (min 5 characters).');
      return;
    }

    if (isPost && !postId) {
      Alert.alert('Missing post id');
      return;
    }
    if (!isPost && !userId) {
      Alert.alert('Missing user id');
      return;
    }

    mutation.mutate(
      {
        postId: isPost ? Number(postId) : undefined,
        userId: !isPost ? String(userId) : undefined,
        isReported: false,
        reason: trimmed,
        type: isPost ? 'post' : 'user',
      },
      {
        onSuccess: () => {
          showToast?.('Report submitted. Thank you.');
          router.back();
        },
        onError: err => {
          console.error('Report failed', err);
          Alert.alert('Failed to submit report. Please try again.');
        },
      }
    );
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <BackHeader title='' />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          multiline
          maxLength={MAX_LENGTH}
          style={styles.input}
          editable={!submitting}
          textAlignVertical='top'
        />
        <Text style={styles.counter}>
          {message.length}/{MAX_LENGTH}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancel]}
            onPress={() => router.back()}
            disabled={submitting}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <Text style={styles.buttonText}>Send Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'flex-start',
  },
  header: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 6, color: '#111' },
  subtitle: { fontSize: 13, color: '#666' },
  input: {
    minHeight: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    padding: 12,
    marginTop: 14,
    fontSize: 15,
    color: '#111',
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: 6,
    color: '#999',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 18,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#111',
    minWidth: 110,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600' },
  cancel: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelText: { color: '#111', fontWeight: '600' },
});
