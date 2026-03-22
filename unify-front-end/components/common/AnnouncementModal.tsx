import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AnnouncementModalProps {
  storageKey: string;
  title: string;
  body: string;
  buttonLabel?: string;
  icon?: React.ReactNode;
}

export default function AnnouncementModal({
  storageKey,
  title,
  body,
  buttonLabel = 'Got it',
  icon,
}: AnnouncementModalProps) {
  // null = loading, true = show, false = hide
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const val = await AsyncStorage.getItem(storageKey);
        if (!cancelled) {
          setVisible(val !== 'true');
        }
      } catch {
        // On read failure, show the modal
        if (!cancelled) {
          setVisible(true);
        }
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const dismiss = async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(storageKey, 'true');
    } catch {
      // Silently ignore write failures
    }
  };

  // Render nothing until AsyncStorage read resolves, or if permanently dismissed
  if (visible !== true) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={dismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Accent stripe at top */}
          <View style={styles.accentStripe} />

          <View style={styles.content}>
            {icon && (
              <View style={styles.iconContainer}>
                {icon}
              </View>
            )}

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={dismiss}
              activeOpacity={0.82}
            >
              <Text style={styles.buttonText}>{buttonLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxWidth: 320,
    width: '100%',
    overflow: 'hidden',
    // Layered shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 12,
  },

  // Thin warm-neutral accent rule pinned to top of card
  accentStripe: {
    height: 3,
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  content: {
    padding: 24,
  },

  iconContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
    marginBottom: 10,
    lineHeight: 24,
  },

  body: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
  },

  button: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
