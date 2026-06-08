import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Partner } from '@/types/partner';
import Monogram from './Monogram';

type Props = {
  partner: Partner;
  onPress: () => void;
};

export default function PartnerRow({ partner, onPress }: Props) {
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
});
