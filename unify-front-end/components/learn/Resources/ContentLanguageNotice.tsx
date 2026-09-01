import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { shouldShowEnglishContentNotice } from '@/utils/resourcesLanguage';
import { RESOURCE_THEME } from '@/constants/ResourceTheme';

/** Clarifies that organization-provided directory content is not localized yet. */
export default function ContentLanguageNotice() {
  const { t, i18n } = useTranslation();

  if (!shouldShowEnglishContentNotice(i18n.resolvedLanguage ?? i18n.language)) {
    return null;
  }

  return (
    <View style={styles.notice} accessibilityRole='text'>
      <Feather
        name='info'
        size={16}
        color={RESOURCE_THEME.iconNotice}
        style={styles.icon}
      />
      <Text style={styles.text}>
        {t('learn.resources.contentLanguageNotice')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: RESOURCE_THEME.surfaceNotice,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  icon: { marginTop: 1 },
  text: {
    flex: 1,
    color: RESOURCE_THEME.textNotice,
    fontSize: 12.5,
    lineHeight: 18,
  },
});
