import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import BackHeader from '@/components/BackHeader';
import { Theme } from '@/constants/Theme';

/**
 * /giveaway — placeholder for the multi-step entry flow.
 *
 * Phase 2 stub: prevents the banner tap from 404-ing. The real welcome →
 * question → details → success flow lands in Phase 3.
 */
export default function GiveawayScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <BackHeader />
      <View style={styles.body}>
        <Text style={styles.title}>{t('giveaway.welcome.title')}</Text>
        <Text style={styles.subtitle}>{t('giveaway.welcome.subtitle')}</Text>
        <Text style={styles.todo}>Entry flow ships in Phase 3.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.white,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Theme.black,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: Theme.textInput,
  },
  todo: {
    marginTop: 24,
    fontSize: 12,
    fontStyle: 'italic',
    color: Theme.textAlternateGray,
  },
});
