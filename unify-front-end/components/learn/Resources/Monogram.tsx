import React from 'react';
import { View, Text, Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import { getInitials } from '@/utils/initials';
import { PARTNER_CATEGORY_COLORS, type PartnerCategory } from '@/types/partner';

type Props = {
  name: string;
  category: PartnerCategory;
  size: number;
  source?: ImageSourcePropType;
};

/** Logo image when available, else initials on the category accent color. */
export default function Monogram({ name, category, size, source }: Props) {
  const radius = Math.round(size * 0.28);
  const box = { width: size, height: size, borderRadius: radius };

  if (source) {
    return (
      <View style={[styles.imageWrap, box]}>
        <Image source={source} style={{ width: size, height: size }} resizeMode='contain' />
      </View>
    );
  }

  return (
    <View
      style={[box, styles.mono, { backgroundColor: PARTNER_CATEGORY_COLORS[category] }]}
    >
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.38) }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mono: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontWeight: '800' },
});
