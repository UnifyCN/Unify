import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPartnerBySlug } from '@/constants/Partners';
import {
  PARTNER_CATEGORY_LABELS,
  PARTNER_CATEGORY_ICONS,
  PARTNER_CATEGORY_COLORS,
  PARTNER_CATEGORY_TINTS,
} from '@/types/partner';
import Monogram from '@/components/learn/Resources/Monogram';
import { useAnalytics } from '@/utils/analytics';

export default function PartnerDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trackResourcesPartnerOpened, trackResourcesPartnerWebsiteOpened } =
    useAnalytics();
  const partner = slug ? getPartnerBySlug(slug) : undefined;

  useEffect(() => {
    if (partner) trackResourcesPartnerOpened(partner.slug, partner.category);
  }, [partner, trackResourcesPartnerOpened]);

  const screenOptions = (
    <Stack.Screen
      options={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: true }}
    />
  );

  if (!partner) {
    return (
      <View style={[styles.notFound, { paddingTop: insets.top + 12 }]}>
        {screenOptions}
        <TouchableOpacity onPress={() => router.back()} style={styles.backFloat}>
          <Feather name='chevron-left' size={22} color='#1A1A1A' />
        </TouchableOpacity>
        <Text style={styles.notFoundText}>This resource is no longer available.</Text>
      </View>
    );
  }

  const color = PARTNER_CATEGORY_COLORS[partner.category];
  const tint = PARTNER_CATEGORY_TINTS[partner.category];
  const categoryLabel = PARTNER_CATEGORY_LABELS[partner.category];
  const categoryIcon = PARTNER_CATEGORY_ICONS[partner.category];

  const handleVisit = async () => {
    if (!partner.websiteUrl) return;
    trackResourcesPartnerWebsiteOpened(
      partner.slug,
      partner.category,
      partner.partnershipType
    );
    try {
      await WebBrowser.openBrowserAsync(partner.websiteUrl, {
        controlsColor: color,
        toolbarColor: '#FFFFFF',
      });
    } catch {
      // In-app browser failed to open; nothing destructive to recover.
    }
  };

  return (
    <View style={styles.root}>
      {screenOptions}
      <StatusBar style='light' />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        {partner.heroImage ? (
          <Image source={partner.heroImage} style={styles.hero} resizeMode='cover' />
        ) : (
          <LinearGradient colors={[color, tint]} style={styles.hero} />
        )}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backFloat, { top: insets.top + 8 }]}
          accessibilityRole='button'
          accessibilityLabel='Back'
        >
          <Feather name='chevron-left' size={22} color='#FFFFFF' />
        </TouchableOpacity>

        <View style={styles.logoWrap}>
          <Monogram
            name={partner.name}
            category={partner.category}
            size={62}
            source={partner.logo}
          />
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{partner.name}</Text>
          <View style={[styles.pill, { backgroundColor: tint }]}>
            <MaterialCommunityIcons name={categoryIcon as any} size={13} color={color} />
            <Text style={[styles.pillText, { color }]}>{categoryLabel}</Text>
          </View>
          <Text style={styles.location}>{partner.location}</Text>

          <Text style={styles.sectionHead}>About</Text>
          <Text style={styles.about}>{partner.description}</Text>

          {partner.highlights.length > 0 && (
            <>
              <Text style={styles.sectionHead}>How they help newcomers</Text>
              {partner.highlights.map((h, i) => (
                <View key={i} style={styles.hRow}>
                  <View style={[styles.hDot, { backgroundColor: tint }]}>
                    <Feather name='check' size={12} color={color} />
                  </View>
                  <Text style={styles.hText}>{h}</Text>
                </View>
              ))}
            </>
          )}

          {partner.websiteUrl && (
            <TouchableOpacity
              onPress={handleVisit}
              activeOpacity={0.85}
              style={styles.visit}
              accessibilityRole='button'
              accessibilityLabel={`Visit ${partner.name} website`}
            >
              <Text style={styles.visitText}>Visit website</Text>
              <Feather name='external-link' size={16} color='#FFFFFF' />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  hero: { width: '100%', height: 180 },
  backFloat: {
    position: 'absolute',
    left: 14,
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: { marginTop: -34, marginLeft: 16 },
  body: { paddingHorizontal: 16, paddingTop: 10 },
  name: { fontSize: 22, fontWeight: '800', color: '#161616', letterSpacing: -0.4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginTop: 8,
  },
  pillText: { fontSize: 11, fontWeight: '700' },
  location: { fontSize: 12.5, color: '#8A8A8E', marginTop: 8 },
  sectionHead: {
    fontSize: 13,
    fontWeight: '800',
    color: '#161616',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 20,
    marginBottom: 8,
  },
  about: { fontSize: 14, lineHeight: 21, color: '#444' },
  hRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: 10 },
  hDot: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  hText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: '#3A3A3A' },
  visit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#161616',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 24,
  },
  visitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  notFound: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 16 },
  notFoundText: { marginTop: 80, textAlign: 'center', color: '#8A8A8E', fontSize: 14 },
});
