import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COST_LABEL_KEYS, type Partner } from '@/types/partner';
import Monogram from './Monogram';

type Props = {
  partner: Partner;
  onPress: () => void;
};

export default function PartnerRow({ partner, onPress }: Props) {
  const { t } = useTranslation();
  const costLabel = partner.cost ? t(COST_LABEL_KEYS[partner.cost]) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.row}
      accessibilityRole='button'
      accessibilityLabel={partner.name}
    >
      <Monogram
        name={partner.name}
        category={partner.category}
        size={38}
        source={partner.logo}
      />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {partner.name}
        </Text>
        <Text style={styles.tagline} numberOfLines={1}>
          {partner.tagline}
        </Text>
        <View style={styles.chips}>
          <View style={styles.chip}>
            <Feather name='map-pin' size={10} color='#6B7280' />
            <Text style={styles.chipText} numberOfLines={1}>
              {partner.serviceArea}
            </Text>
          </View>
          {costLabel && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{costLabel}</Text>
            </View>
          )}
        </View>
      </View>
      <Feather name='chevron-right' size={20} color='#C9C9D1' />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECECEF',
  },
  body: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  tagline: { fontSize: 12, color: '#8A8A8E', marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  chipText: { fontSize: 10.5, fontWeight: '600', color: '#6B7280' },
});
