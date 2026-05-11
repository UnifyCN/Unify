import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { initMetaSDK } from '@/services/analytics/initMetaSDK';
import { Theme } from '@/constants/Theme';

interface Props {
  onComplete: () => void;
}

export default function ATTPrePromptScreen({ onComplete }: Props) {
  const { t } = useTranslation();

  const handleContinue = async () => {
    try {
      if (Platform.OS === 'ios') {
        await initMetaSDK({ requestATT: true });
      }
    } catch (err) {
      console.warn('[ATTPrePrompt] initMetaSDK failed (continue)', err);
    } finally {
      onComplete();
    }
  };

  const handleNotNow = async () => {
    try {
      if (Platform.OS === 'ios') {
        await initMetaSDK({ requestATT: false });
      }
    } catch (err) {
      console.warn('[ATTPrePrompt] initMetaSDK failed (notNow)', err);
    } finally {
      onComplete();
    }
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
    backgroundColor: Theme.white,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    color: Theme.black,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: Theme.textAlternateGray,
    marginBottom: 40,
  },
  primaryBtn: {
    backgroundColor: Theme.primaryGatherRed,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: Theme.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Theme.textAlternateGray,
    fontSize: 16,
    fontWeight: '500',
  },
});
