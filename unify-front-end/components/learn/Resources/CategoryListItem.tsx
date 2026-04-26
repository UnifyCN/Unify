import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import {
  PARTNER_CATEGORY_LABELS,
  PARTNER_CATEGORY_ICONS,
  PARTNER_CATEGORY_DESCRIPTIONS,
  type PartnerCategory,
} from '@/types/partner';

type Props = {
  category: PartnerCategory;
  partnerCount: number;
  onPress: () => void;
};

export default function CategoryListItem({
  category,
  partnerCount,
  onPress,
}: Props) {
  const label = PARTNER_CATEGORY_LABELS[category];
  const description = PARTNER_CATEGORY_DESCRIPTIONS[category];
  const iconName = PARTNER_CATEGORY_ICONS[category];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.container}
      accessibilityRole='button'
      accessibilityLabel={`${label}, ${partnerCount} trusted partner${
        partnerCount === 1 ? '' : 's'
      }`}
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons
          name={iconName as any}
          size={24}
          color='#343232'
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {partnerCount} trusted partner{partnerCount === 1 ? '' : 's'}
          {' · '}
          {description}
        </Text>
      </View>
      <Feather name='chevron-right' size={20} color='#878787' />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#575757',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  body: {
    flex: 1,
    paddingRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343232',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#575757',
    lineHeight: 18,
  },
});
