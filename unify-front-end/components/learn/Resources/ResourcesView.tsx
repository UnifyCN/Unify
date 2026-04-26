import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAnalytics } from '@/utils/analytics';
import { getCategoriesWithPartners } from '@/constants/Partners';
import type { PartnerCategory } from '@/types/partner';
import DisclosureCard from './DisclosureCard';
import CategoryListItem from './CategoryListItem';
import CategoryDetail from './CategoryDetail';

/**
 * Root view for the Resources tab inside Learn.
 *
 * Renders the category list by default. Tapping a category sets local
 * state and renders the category detail (V1 keeps navigation in-screen
 * rather than using router routes — see plan-eng-review for rationale).
 */
export default function ResourcesView() {
  const [selectedCategory, setSelectedCategory] =
    useState<PartnerCategory | null>(null);
  const {
    trackResourcesViewed,
    trackResourcesCategoryOpened,
  } = useAnalytics();

  const categories = getCategoriesWithPartners();

  // Fire view event once per mount.
  useEffect(() => {
    trackResourcesViewed('learn_tab');
  }, [trackResourcesViewed]);

  if (selectedCategory) {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CategoryDetail
          category={selectedCategory}
          onBack={() => setSelectedCategory(null)}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Trusted services for newcomers</Text>
      <Text style={styles.subtitle}>
        Curated partners for the essentials you need in your first months in
        Canada.
      </Text>

      <DisclosureCard />

      {categories.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>We're vetting partners</Text>
          <Text style={styles.emptyText}>
            We're carefully selecting trusted partners for you. Check back soon.
          </Text>
        </View>
      ) : (
        categories.map(({ category, partnerCount }) => (
          <CategoryListItem
            key={category}
            category={category}
            partnerCount={partnerCount}
            onPress={() => {
              trackResourcesCategoryOpened(category, partnerCount);
              setSelectedCategory(category);
            }}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#575757',
    marginBottom: 16,
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343232',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#575757',
    textAlign: 'center',
    lineHeight: 18,
  },
});
