import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  PARTNER_CATEGORY_LABELS,
  PARTNER_CATEGORY_DESCRIPTIONS,
  type PartnerCategory,
} from '@/types/partner';
import { getPartnersByCategory } from '@/constants/Partners';
import PartnerRow from './PartnerRow';

type Props = {
  category: PartnerCategory;
  onBack: () => void;
};

export default function CategoryDetail({ category, onBack }: Props) {
  const router = useRouter();
  const label = PARTNER_CATEGORY_LABELS[category];
  const description = PARTNER_CATEGORY_DESCRIPTIONS[category];
  const partners = getPartnersByCategory(category);

  return (
    <View style={styles.root}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backRow}
        activeOpacity={0.7}
        accessibilityRole='button'
        accessibilityLabel='Back to categories'
      >
        <Feather name='chevron-left' size={20} color='#343232' />
        <Text style={styles.backText}>Resources</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{label}</Text>
      <Text style={styles.description}>{description}</Text>

      {partners.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No active partners in this category yet.</Text>
        </View>
      ) : (
        partners.map(partner => (
          <PartnerRow
            key={partner.slug}
            partner={partner}
            onPress={() => router.push(`/(tabs)/Learn/resources/${partner.slug}` as any)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 4 },
  backText: { fontSize: 15, fontWeight: '500', color: '#343232', marginLeft: 4 },
  title: { fontSize: 24, fontWeight: '600', color: '#000', marginBottom: 6 },
  description: { fontSize: 14, lineHeight: 20, color: '#575757', marginBottom: 12 },
  empty: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#878787' },
});
