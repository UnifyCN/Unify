import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAnalytics } from '@/utils/analytics';
import {
  getActivePartners,
  getCategoriesWithPartners,
} from '@/constants/Partners';
import { RESOURCE_THEME } from '@/constants/ResourceTheme';
import {
  PARTNER_CATEGORY_LABEL_KEYS,
  type PartnerCategory,
} from '@/types/partner';
import { selectPartnersMatching } from '@/utils/searchPartners';
import CategoryTile from './CategoryTile';
import CategoryDetail from './CategoryDetail';
import ContentLanguageNotice from './ContentLanguageNotice';
import HowWeChooseSheet from './HowWeChooseSheet';
import PartnerRow from './PartnerRow';
import ResourcesSearchBar from './ResourcesSearchBar';

/** Grid columns in Figma 8129:32595. */
const COLUMNS = 2;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/**
 * Root view for the Resources tab inside Learn (Figma 8129:32045).
 *
 * Category grid by default; typing in the search field swaps the grid for
 * matching partners across every category, and tapping a category renders its
 * detail in-screen. Tapping a partner pushes app/(tabs)/Learn/resources/[slug].
 */
export default function ResourcesView() {
  const [selectedCategory, setSelectedCategory] =
    useState<PartnerCategory | null>(null);
  const [query, setQuery] = useState('');
  const [howWeChooseVisible, setHowWeChooseVisible] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { trackResourcesViewed, trackResourcesCategoryOpened } = useAnalytics();
  const categories = getCategoriesWithPartners();

  useEffect(() => {
    trackResourcesViewed();
  }, [trackResourcesViewed]);

  const labelFor = useCallback(
    (category: PartnerCategory) => t(PARTNER_CATEGORY_LABEL_KEYS[category]),
    [t]
  );

  const isSearching = query.trim().length > 0;
  const results = useMemo(
    () =>
      isSearching
        ? selectPartnersMatching(getActivePartners(), query, labelFor)
        : [],
    [isSearching, query, labelFor]
  );

  const openPartner = (slug: string) => {
    Keyboard.dismiss();
    router.push(`/(tabs)/Learn/resources/${slug}` as any);
  };

  if (selectedCategory) {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior='automatic'
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
    <>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior='automatic'
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
        keyboardDismissMode='on-drag'
      >
        <Text style={styles.title} accessibilityRole='header'>
          {t('learn.resources.title')}
        </Text>
        <Text style={styles.subtitle}>{t('learn.resources.subtitle')}</Text>
        {/* Figma breaks the line before the link; a Touchable rather than a
            nested <Text onPress> so the tap target clears 44pt. */}
        <TouchableOpacity
          onPress={() => setHowWeChooseVisible(true)}
          hitSlop={{ top: 10, bottom: 12, left: 8, right: 8 }}
          accessibilityRole='button'
        >
          <Text style={[styles.subtitle, styles.link]}>
            {t('learn.resources.howWeChoose.link')}
          </Text>
        </TouchableOpacity>

        <ContentLanguageNotice />

        <View style={styles.searchWrapper}>
          <ResourcesSearchBar value={query} onChangeText={setQuery} />
        </View>

        {isSearching ? (
          results.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {t('learn.resources.noSearchResultsTitle')}
              </Text>
              <Text style={styles.emptyText}>
                {t('learn.resources.noSearchResultsText', {
                  query: query.trim(),
                })}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.resultCount}>
                {t('learn.resources.searchResultCount', {
                  count: results.length,
                })}
              </Text>
              {results.map(partner => (
                <PartnerRow
                  key={partner.slug}
                  partner={partner}
                  onPress={() => openPartner(partner.slug)}
                />
              ))}
            </View>
          )
        ) : categories.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {t('learn.resources.emptyTitle')}
            </Text>
            <Text style={styles.emptyText}>
              {t('learn.resources.emptyText')}
            </Text>
          </View>
        ) : (
          chunk(categories, COLUMNS).map(row => (
            <View key={row[0].category} style={styles.gridRow}>
              {row.map(({ category, partnerCount }) => (
                <CategoryTile
                  key={category}
                  category={category}
                  partnerCount={partnerCount}
                  onPress={() => {
                    trackResourcesCategoryOpened(category);
                    setSelectedCategory(category);
                  }}
                />
              ))}
              {/* Keeps a lone trailing tile at column width instead of full. */}
              {row.length < COLUMNS && <View style={styles.gridFiller} />}
            </View>
          ))
        )}
      </ScrollView>

      <HowWeChooseSheet
        visible={howWeChooseVisible}
        onClose={() => setHowWeChooseVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 100 },
  title: {
    // Matches the Lessons greeting: same tab, same slot, same role.
    fontSize: 24,
    fontWeight: '600',
    color: RESOURCE_THEME.textHeading,
    marginBottom: 3,
  },
  subtitle: {
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 18.9,
    color: RESOURCE_THEME.textSecondary,
  },
  link: {
    color: RESOURCE_THEME.link,
    textDecorationLine: 'underline',
  },
  searchWrapper: { marginTop: 12, marginBottom: 12 },
  gridRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  gridFiller: { flex: 1 },
  resultCount: {
    fontWeight: '500',
    fontSize: 12,
    color: RESOURCE_THEME.textCount,
    marginBottom: 4,
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
    backgroundColor: RESOURCE_THEME.surfaceSubtle,
    borderRadius: 12,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: RESOURCE_THEME.textHeading,
    marginBottom: 6,
  },
  emptyText: {
    fontWeight: '400',
    fontSize: 13,
    color: RESOURCE_THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
