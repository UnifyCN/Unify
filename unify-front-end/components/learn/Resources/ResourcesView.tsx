import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAnalytics } from '@/utils/analytics';
import { getCategoriesWithPartners } from '@/constants/Partners';
import type { PartnerCategory } from '@/types/partner';
import CategoryTile from './CategoryTile';
import CategoryDetail from './CategoryDetail';

/**
 * Root view for the Resources tab inside Learn.
 * Category grid by default; tapping a category renders its detail in-screen.
 * Tapping a partner pushes app/(tabs)/Learn/resources/[slug].
 */
export default function ResourcesView() {
  const [selectedCategory, setSelectedCategory] = useState<PartnerCategory | null>(null);
  const { trackResourcesViewed, trackResourcesCategoryOpened } = useAnalytics();
  const categories = getCategoriesWithPartners();

  useEffect(() => {
    trackResourcesViewed('learn_tab');
  }, [trackResourcesViewed]);

  if (selectedCategory) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <CategoryDetail category={selectedCategory} onBack={() => setSelectedCategory(null)} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Trusted services</Text>
      <Text style={styles.subtitle}>Organizations that help you settle in Canada.</Text>

      {categories.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>We're adding partners</Text>
          <Text style={styles.emptyText}>
            We're carefully selecting trusted organizations for you. Check back soon.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {categories.map(({ category, partnerCount }, index) => {
            const isLoneTrailing =
              index === categories.length - 1 && categories.length % 2 === 1;
            return (
              <CategoryTile
                key={category}
                category={category}
                partnerCount={partnerCount}
                wide={isLoneTrailing}
                onPress={() => {
                  trackResourcesCategoryOpened(category, partnerCount);
                  setSelectedCategory(category);
                }}
              />
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '600', color: '#000', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, color: '#575757', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#343232', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#575757', textAlign: 'center', lineHeight: 18 },
});
