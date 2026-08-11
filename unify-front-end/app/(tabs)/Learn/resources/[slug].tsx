import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { getPartnerBySlug } from '@/constants/Partners';
import {
  PARTNER_CATEGORY_LABEL_KEYS,
  PARTNER_CATEGORY_ICONS,
  PARTNER_CATEGORY_COLORS,
  PARTNER_CATEGORY_TINTS,
  COST_LABEL_KEYS,
  type Partner,
  type PartnerProgram,
} from '@/types/partner';
import Monogram from '@/components/learn/Resources/Monogram';
import { useAnalytics } from '@/utils/analytics';

/** Opens tel:/mailto:/maps links, ignoring handlers the device lacks. */
async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    // No handler for this scheme (e.g. tel: on a tablet); nothing to recover.
  }
}

function mapsUrl(address: string) {
  const q = encodeURIComponent(address);
  return Platform.select({
    ios: `http://maps.apple.com/?q=${q}`,
    default: `https://www.google.com/maps/search/?api=1&query=${q}`,
  }) as string;
}

/** One labelled line in "How to get help". Renders nothing without a value. */
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Feather name={icon} size={14} color='#9CA3AF' style={styles.detailIcon} />
      <View style={styles.detailBody}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onPress,
  a11y,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  a11y: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.actionSecondary}
      accessibilityRole='button'
      accessibilityLabel={a11y}
    >
      <Feather name={icon} size={15} color={color} />
      <Text style={[styles.actionSecondaryText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** True when any "How to get help" field is populated. */
function hasAnyHelpField(p: Partner) {
  return Boolean(
    p.eligibility ||
      p.howToStart ||
      p.phone ||
      p.email ||
      p.address ||
      p.hours ||
      p.languages?.length ||
      p.cost ||
      p.serviceArea
  );
}

export default function PartnerDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    trackResourcesPartnerOpened,
    trackResourcesPartnerWebsiteOpened,
    trackResourcesProgramOpened,
  } = useAnalytics();
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backFloat, { top: insets.top + 8 }]}
          accessibilityRole='button'
          accessibilityLabel={t('common.back')}
        >
          <Feather name='chevron-left' size={22} color='#FFFFFF' />
        </TouchableOpacity>
        <Text style={styles.notFoundText}>{t('learn.resources.notFound')}</Text>
      </View>
    );
  }

  const color = PARTNER_CATEGORY_COLORS[partner.category];
  const tint = PARTNER_CATEGORY_TINTS[partner.category];
  const hasHelpBlock = hasAnyHelpField(partner);
  // Large agencies run programs under different funding streams with different
  // rules, so there is often no single org-wide answer to "who is this for".
  const programEligibility = partner.programs?.some(p => p.eligibility) ?? false;
  const categoryLabel = t(PARTNER_CATEGORY_LABEL_KEYS[partner.category]);
  const categoryIcon = PARTNER_CATEGORY_ICONS[partner.category];

  const handleVisit = async () => {
    if (!partner.website) return;
    trackResourcesPartnerWebsiteOpened(
      partner.slug,
      partner.category,
      partner.partnershipType
    );
    try {
      await WebBrowser.openBrowserAsync(partner.website, {
        controlsColor: color,
        toolbarColor: '#FFFFFF',
      });
    } catch {
      // In-app browser failed to open; nothing destructive to recover.
    }
  };

  const handleOpenProgram = async (program: PartnerProgram) => {
    if (!program.url) return;
    trackResourcesProgramOpened(partner.slug, program.name, partner.category);
    try {
      await WebBrowser.openBrowserAsync(program.url, {
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
          accessibilityLabel={t('common.back')}
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

          <Text style={styles.sectionHead}>{t('learn.resources.about')}</Text>
          <Text style={styles.about}>{partner.description}</Text>

          {partner.highlights.length > 0 && (
            <>
              <Text style={styles.sectionHead}>
                {t('learn.resources.howTheyHelp')}
              </Text>
              {partner.highlights.map(h => (
                <View key={h} style={styles.hRow}>
                  <View style={[styles.hDot, { backgroundColor: tint }]}>
                    <Feather name='check' size={12} color={color} />
                  </View>
                  <Text style={styles.hText}>{h}</Text>
                </View>
              ))}
            </>
          )}

          {partner.programs && partner.programs.length > 0 && (
            <>
              <Text style={styles.sectionHead}>{t('learn.resources.programs')}</Text>
              {partner.programs.map(program => {
                const body = (
                  <>
                    <View style={styles.programText}>
                      <Text style={styles.programName}>{program.name}</Text>
                      <Text style={styles.programDesc}>{program.description}</Text>
                      {program.cost && (
                        <View style={[styles.programCost, { backgroundColor: tint }]}>
                          <Text style={[styles.programCostText, { color }]}>
                            {t(COST_LABEL_KEYS[program.cost])}
                          </Text>
                        </View>
                      )}
                      {program.eligibility && (
                        <View style={styles.programElig}>
                          <Text style={styles.programEligHead}>
                            {t('learn.resources.whoItsFor')}
                          </Text>
                          <Text style={styles.programEligText}>
                            {program.eligibility}
                          </Text>
                        </View>
                      )}
                    </View>
                    {program.url && (
                      <Feather
                        name='external-link'
                        size={16}
                        color={color}
                        style={styles.programIcon}
                      />
                    )}
                  </>
                );
                // Not every partner publishes a page per program; without a
                // link the card is information, not a tap target.
                return program.url ? (
                  <TouchableOpacity
                    key={program.name}
                    onPress={() => handleOpenProgram(program)}
                    activeOpacity={0.75}
                    style={styles.programCard}
                    accessibilityRole='button'
                    accessibilityLabel={t('learn.resources.opensInBrowser', {
                      name: program.name,
                    })}
                  >
                    {body}
                  </TouchableOpacity>
                ) : (
                  <View key={program.name} style={styles.programCard}>
                    {body}
                  </View>
                );
              })}
            </>
          )}

          {/* How to get help — only populated fields render. An absent value
              means the partner does not publish it, so nothing is inferred. */}
          {hasHelpBlock && (
            <>
              <Text style={styles.sectionHead}>
                {t('learn.resources.howToGetHelp')}
              </Text>

              {/* Eligibility leads: routing someone to a service they are not
                  eligible for is this feature's main failure mode. */}
              {(partner.eligibility || programEligibility) && (
                <View style={[styles.eligibility, { backgroundColor: tint }]}>
                  <Text style={[styles.eligibilityHead, { color }]}>
                    {t('learn.resources.whoItsFor')}
                  </Text>
                  <Text style={styles.eligibilityText}>
                    {partner.eligibility ?? t('learn.resources.variesByProgram')}
                  </Text>
                </View>
              )}

              <DetailRow
                icon='play-circle'
                label={t('learn.resources.howToStart')}
                value={partner.howToStart}
              />
              <DetailRow
                icon='phone'
                label={t('learn.resources.phone')}
                value={partner.phone}
              />
              <DetailRow
                icon='mail'
                label={t('learn.resources.email')}
                value={partner.email}
              />
              <DetailRow
                icon='map-pin'
                label={t('learn.resources.address')}
                value={partner.address}
              />
              <DetailRow
                icon='clock'
                label={t('learn.resources.hours')}
                value={partner.hours}
              />
              <DetailRow
                icon='globe'
                label={t('learn.resources.languages')}
                value={partner.languages?.join(', ')}
              />
              <DetailRow
                icon='tag'
                label={t('learn.resources.costLabel')}
                value={partner.cost ? t(COST_LABEL_KEYS[partner.cost]) : undefined}
              />
              <DetailRow
                icon='map'
                label={t('learn.resources.serves')}
                value={partner.serviceArea}
              />
            </>
          )}

          {/* Actions. The primary button is whatever the partner actually
              wants you to do — "Get a quote", "Apply online" — falling back to
              "Visit website". Call takes the primary slot only when there is
              no website to send you to. */}
          <View style={styles.actions}>
            {partner.website ? (
              <TouchableOpacity
                onPress={handleVisit}
                activeOpacity={0.85}
                style={[styles.actionPrimary, { backgroundColor: color }]}
                accessibilityRole='button'
                accessibilityLabel={t('learn.resources.visitWebsiteA11y', {
                  name: partner.name,
                })}
              >
                <Feather name='external-link' size={16} color='#FFFFFF' />
                <Text style={styles.actionPrimaryText}>
                  {t(partner.ctaLabelKey ?? 'learn.resources.visitWebsite')}
                </Text>
              </TouchableOpacity>
            ) : (
              partner.phone && (
                <TouchableOpacity
                  onPress={() => openUrl(`tel:${partner.phone!.replace(/[^\d+]/g, '')}`)}
                  activeOpacity={0.85}
                  style={[styles.actionPrimary, { backgroundColor: color }]}
                  accessibilityRole='button'
                  accessibilityLabel={t('learn.resources.callA11y', {
                    name: partner.name,
                  })}
                >
                  <Feather name='phone' size={16} color='#FFFFFF' />
                  <Text style={styles.actionPrimaryText}>
                    {t('learn.resources.call')}
                  </Text>
                </TouchableOpacity>
              )
            )}

            <View style={styles.actionRow}>
              {partner.website && partner.phone && (
                <ActionButton
                  icon='phone'
                  label={t('learn.resources.call')}
                  color={color}
                  onPress={() => openUrl(`tel:${partner.phone!.replace(/[^\d+]/g, '')}`)}
                  a11y={t('learn.resources.callA11y', { name: partner.name })}
                />
              )}
              {partner.email && (
                <ActionButton
                  icon='mail'
                  label={t('learn.resources.email')}
                  color={color}
                  onPress={() => openUrl(`mailto:${partner.email}`)}
                  a11y={t('learn.resources.emailA11y', { name: partner.name })}
                />
              )}
              {partner.address && (
                <ActionButton
                  icon='navigation'
                  label={t('learn.resources.directions')}
                  color={color}
                  onPress={() => openUrl(mapsUrl(partner.address!))}
                  a11y={t('learn.resources.directionsA11y', { name: partner.name })}
                />
              )}
            </View>
          </View>
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
  programCard: {
    flexDirection: 'row',
    // Top-aligned: cards vary in height once eligibility and cost render, and
    // a centred icon floats away from the title it belongs to.
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEF',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  programText: { flex: 1 },
  programName: { fontSize: 14.5, fontWeight: '700', color: '#1F2937' },
  programDesc: { fontSize: 12.5, lineHeight: 18, color: '#6B7280', marginTop: 3 },
  programIcon: { marginTop: 1 },
  programCost: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  programCostText: { fontSize: 10.5, fontWeight: '700' },
  programElig: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ECECEF',
  },
  programEligHead: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  programEligText: { fontSize: 12, lineHeight: 17, color: '#4B5563' },

  eligibility: { borderRadius: 12, padding: 12, marginBottom: 14 },
  eligibilityHead: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  eligibilityText: { fontSize: 13, lineHeight: 19, color: '#374151' },

  detailRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  detailIcon: { marginTop: 2 },
  detailBody: { flex: 1 },
  detailLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: { fontSize: 13.5, lineHeight: 19, color: '#374151', marginTop: 1 },

  actions: { marginTop: 22, gap: 10 },
  actionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  actionPrimaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#ECECEF',
    borderRadius: 12,
    paddingVertical: 11,
  },
  actionSecondaryText: { fontSize: 13, fontWeight: '700' },
  notFound: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 16 },
  notFoundText: { marginTop: 80, textAlign: 'center', color: '#8A8A8E', fontSize: 14 },
});
