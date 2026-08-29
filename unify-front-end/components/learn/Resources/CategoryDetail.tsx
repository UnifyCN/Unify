import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  PARTNER_CATEGORY_LABEL_KEYS,
  PARTNER_CATEGORY_DESCRIPTION_KEYS,
  type PartnerCategory,
} from '@/types/partner';
import { getPartnersByCategory } from '@/constants/Partners';
import { RESOURCE_THEME } from '@/constants/ResourceTheme';
import PartnerRow from './PartnerRow';

type Props = {
  category: PartnerCategory;
  onBack: () => void;
};

export default function CategoryDetail({ category, onBack }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const label = t(PARTNER_CATEGORY_LABEL_KEYS[category]);
  const description = t(PARTNER_CATEGORY_DESCRIPTION_KEYS[category]);
  const partners = getPartnersByCategory(category);

  return (
    <View style={styles.root}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backRow}
        activeOpacity={0.7}
        accessibilityRole='button'
        accessibilityLabel={t('learn.resources.backToCategories')}
        hitSlop={8}
      >
        <Feather
          name='chevron-left'
          size={18}
          color={RESOURCE_THEME.textSecondary}
        />
        <Text style={styles.backText}>{t('learn.segment.resources')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{label}</Text>
      <Text style={styles.description}>{description}</Text>

      {partners.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {t('learn.resources.noPartnersInCategory')}
          </Text>
        </View>
      ) : (
        partners.map(partner => (
          <PartnerRow
            key={partner.slug}
            partner={partner}
            onPress={() =>
              router.push(`/(tabs)/Learn/resources/${partner.slug}` as any)
            }
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    // The 44pt touch target already leaves ~13pt under the label, which is
    // the 12pt gap the spec draws between the back nav and the title.
    minHeight: 44,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: RESOURCE_THEME.textSecondary,
    marginLeft: 4,
  },
  title: {
    // Same size and weight as the landing heading one tap back, rather than
    // the spec's 24/700, so the two Resources screens read as one.
    fontSize: 24,
    fontWeight: '600',
    color: RESOURCE_THEME.textHeading,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 19,
    color: RESOURCE_THEME.textSecondary,
    marginBottom: 12,
  },
  empty: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: RESOURCE_THEME.textMuted },
});
