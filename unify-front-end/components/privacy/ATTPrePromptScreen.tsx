import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { initMetaSDK } from '@/services/analytics/initMetaSDK';

interface Props {
  onComplete: () => void;
}

export default function ATTPrePromptScreen({ onComplete }: Props) {
  const { t } = useTranslation();

  const handleContinue = async () => {
    if (Platform.OS === 'ios') {
      await initMetaSDK({ requestATT: true });
    }
    onComplete();
  };

  const handleNotNow = async () => {
    if (Platform.OS === 'ios') {
      await initMetaSDK({ requestATT: false });
    }
    onComplete();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('privacy.attPrompt.title')}</Text>
      <Text style={styles.body}>{t('privacy.attPrompt.body')}</Text>

      <Pressable style={styles.primaryBtn} onPress={handleContinue}>
        <Text style={styles.primaryBtnText}>
          {t('privacy.attPrompt.continue')}
        </Text>
      </Pressable>

      <Pressable style={styles.secondaryBtn} onPress={handleNotNow}>
        <Text style={styles.secondaryBtnText}>
          {t('privacy.attPrompt.notNow')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000000',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3c3c43',
    marginBottom: 40,
  },
  primaryBtn: {
    backgroundColor: '#ff9d40',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#3c3c43',
    fontSize: 16,
    fontWeight: '500',
  },
});
