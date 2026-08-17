import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

/** Clarifies that organization-provided directory content is not localized yet. */
export default function ContentLanguageNotice() {
  const { t } = useTranslation();

  return (
    <View style={styles.notice} accessibilityRole='text'>
      <Feather name='info' size={16} color='#465570' style={styles.icon} />
      <Text style={styles.text}>
        {t('learn.resources.contentLanguageNotice')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  icon: { marginTop: 1 },
  text: { flex: 1, color: '#46505E', fontSize: 12.5, lineHeight: 18 },
});
