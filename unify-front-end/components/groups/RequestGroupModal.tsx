import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from 'react-native';
import { sendGroupRequestEmail } from '@/services/groups/sendGroupRequestEmail'

type Props = {
  visible: boolean;
  onClose: () => void;
};

function showToast(message: string) {
  if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
  else Alert.alert('Done', message);
}

export default function RequestGroupModal({ visible, onClose }: Props) {
  const [groupName, setGroupName] = useState('');
  const [audience, setAudience] = useState('');
  const [reason, setReason] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [extraNotes, setExtraNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      groupName.trim().length >= 3 &&
      audience.trim().length >= 3 &&
      reason.trim().length >= 10 &&
      requesterEmail.trim().length >= 5
    );
  }, [groupName, audience, reason, requesterEmail]);

  const reset = () => {
    setGroupName('');
    setAudience('');
    setReason('');
    setRequesterEmail('');
    setExtraNotes('');
    setShowSuccess(false);
  };

  const submit = async () => {
    if (!canSubmit) {
      showToast('Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await sendGroupRequestEmail({
        groupName: groupName.trim(),
        audience: audience.trim(),
        reason: reason.trim(),
        requesterEmail: requesterEmail.trim(),
        extraNotes: extraNotes.trim(),
      });

      // Show success confirmation
      setShowSuccess(true);
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        reset();
        onClose();
      }, 2000);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to send request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{showSuccess ? 'Request Sent!' : 'Request a Group'}</Text>
            {!showSuccess && (
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            )}
          </View>

          {showSuccess ? (
            <View style={styles.successContainer}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successTitle}>Thank you!</Text>
              <Text style={styles.successMessage}>
                Your group request has been sent to our team. We'll review it and get back to you soon.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Group name *</Text>
              <TextInput
                value={groupName}
                onChangeText={setGroupName}
                placeholder="e.g., Newcomers in Vancouver"
                style={styles.input}
                editable={!submitting}
              />

              <Text style={styles.label}>Who is it for? *</Text>
              <TextInput
                value={audience}
                onChangeText={setAudience}
                placeholder="e.g., international students, PR applicants..."
                style={styles.input}
                editable={!submitting}
              />

              <Text style={styles.label}>Why should we create this group? *</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Explain the need (min 10 chars)"
                style={[styles.input, styles.textArea]}
                multiline
                editable={!submitting}
              />

              <Text style={styles.label}>Your email (for follow-up) *</Text>
              <TextInput
                value={requesterEmail}
                onChangeText={setRequesterEmail}
                placeholder="you@email.com"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!submitting}
              />

              <Text style={styles.label}>Extra notes (optional)</Text>
              <TextInput
                value={extraNotes}
                onChangeText={setExtraNotes}
                placeholder="Anything else that helps"
                style={[styles.input, styles.textArea]}
                multiline
                editable={!submitting}
              />

              <Pressable
                onPress={submit}
                disabled={!canSubmit || submitting}
                style={[
                  styles.submitBtn,
                  (!canSubmit || submitting) ? { opacity: 0.5 } : null,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.submitText}>Send Request</Text>
                )}
              </Pressable>

              <Text style={styles.helper}>
                * Required fields. This sends an email to our team.
              </Text>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 6 },
  closeText: { fontSize: 18 },

  content: { padding: 16, gap: 8 },
  label: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  submitBtn: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  submitText: { fontSize: 16, fontWeight: '700' },
  helper: { marginTop: 6, fontSize: 12, color: '#666' },

  // Success state styles
  successContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    color: '#000',
  },
  successMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
