import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  PARTNER_CATEGORY_LABEL_KEYS,
  PARTNER_CATEGORY_ICON_TINTS,
  type PartnerCategory,
} from '@/types/partner';
import { RESOURCE_THEME } from '@/constants/ResourceTheme';
import CategoryIcon from './CategoryIcon';

type Props = {
  category: PartnerCategory;
  partnerCount: number;
  onPress: () => void;
};

/**
 * One cell of the two-column category grid (Figma 8129:32586).
 *
 * The label reserves two lines whether or not it wraps, so a wrapping title
 * ("Community & Belonging") does not make its row taller than its neighbour.
 */
export default function CategoryTile({
  category,
  partnerCount,
  onPress,
}: Props) {
  const { t } = useTranslation();
  const label = t(PARTNER_CATEGORY_LABEL_KEYS[category]);
  const count = t('learn.resources.orgCount', { count: partnerCount });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.tile}
      accessibilityRole='button'
      // `orgs`, not `count` — `count` is i18next's plural selector, and the
      // already-pluralized org count is being interpolated as text here.
      accessibilityLabel={t('learn.resources.categoryTileA11y', {
        label,
        orgs: count,
      })}
    >
      <View
        style={[
          styles.iconChip,
          { backgroundColor: PARTNER_CATEGORY_ICON_TINTS[category] },
        ]}
      >
        <CategoryIcon category={category} size={20} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.count} numberOfLines={1}>
        {count}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: RESOURCE_THEME.surface,
    borderWidth: 1,
    borderColor: RESOURCE_THEME.cardBorder,
    borderRadius: 20,
    padding: 13,
    // Shared with PathwayCard so both Learn card families cast the same shadow.
    shadowColor: '#575757',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 8,
    fontWeight: '700',
    fontSize: 13.5,
    lineHeight: 16.9,
    // Two lines reserved regardless of wrapping, so tiles in a row match.
    minHeight: 33.8,
    color: RESOURCE_THEME.textCard,
  },
  count: {
    marginTop: 8,
    fontWeight: '500',
    fontSize: 11.5,
    color: RESOURCE_THEME.textCount,
  },
});
