import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  PARTNER_CATEGORY_LABELS,
  PARTNER_CATEGORY_ICONS,
  PARTNER_CATEGORY_COLORS,
  type PartnerCategory,
} from '@/types/partner';

type Props = {
  category: PartnerCategory;
  partnerCount: number;
  /** Full-width tile (used for a lone trailing odd tile). */
  wide?: boolean;
  onPress: () => void;
};

export default function CategoryTile({ category, partnerCount, wide, onPress }: Props) {
  const label = PARTNER_CATEGORY_LABELS[category];
  const color = PARTNER_CATEGORY_COLORS[category];
  const icon = PARTNER_CATEGORY_ICONS[category];
  const count = `${partnerCount} org${partnerCount === 1 ? '' : 's'}`;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.tile, { backgroundColor: color }, wide ? styles.wide : styles.half]}
      accessibilityRole='button'
      accessibilityLabel={`${label}, ${count}`}
    >
      <View style={styles.iconChip}>
        <MaterialCommunityIcons name={icon as any} size={20} color='#FFFFFF' />
      </View>
      <View style={wide ? styles.wideMeta : undefined}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.count}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  half: { width: '48%', height: 104 },
  wide: { width: '100%', flexDirection: 'row', alignItems: 'center', height: 76 },
  wideMeta: { marginLeft: 12 },
  iconChip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  count: { color: 'rgba(255,255,255,0.88)', fontSize: 11.5, fontWeight: '600', marginTop: 2 },
});
