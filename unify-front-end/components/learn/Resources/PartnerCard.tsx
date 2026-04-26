import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import type { Partner } from '@/types/partner';
import { buildPartnerUrl } from '@/utils/partners';
import { useAnalytics } from '@/utils/analytics';

type Props = {
  partner: Partner;
  /** Position in its category list, 0-indexed. Used for analytics. */
  position: number;
};

export default function PartnerCard({ partner, position }: Props) {
  const {
    trackResourcesPartnerCardViewed,
    trackResourcesPartnerCtaTapped,
    trackResourcesPartnerCtaFailed,
    trackResourcesPartnerPromoCopied,
  } = useAnalytics();

  // Fire view event on mount.
  // V1: on-render. Tracked TODO: switch to intersection-based at scale.
  useEffect(() => {
    trackResourcesPartnerCardViewed(partner.slug, partner.category, position);
  }, [
    partner.slug,
    partner.category,
    position,
    trackResourcesPartnerCardViewed,
  ]);

  const handleCopyPromo = async () => {
    if (!partner.promoCode) return;
    try {
      await Clipboard.setStringAsync(partner.promoCode);
      trackResourcesPartnerPromoCopied(partner.slug);
      Alert.alert(
        'Copied',
        `Promo code ${partner.promoCode} copied to clipboard.`
      );
    } catch {
      Alert.alert(
        'Copy failed',
        'Could not copy the promo code. Please try again.'
      );
    }
  };

  const handleVisit = async () => {
    const url = buildPartnerUrl(partner, 'learn_resources');
    // Fire intent event before opening — captures intent even if open fails.
    trackResourcesPartnerCtaTapped(partner.slug, partner.category);
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        throw new Error('URL_NOT_SUPPORTED');
      }
      await Linking.openURL(url);
    } catch (err) {
      const errorType =
        err instanceof Error ? err.message : 'unknown_open_error';
      trackResourcesPartnerCtaFailed(partner.slug, errorType);
      try {
        await Clipboard.setStringAsync(url);
        Alert.alert(
          "Couldn't open link",
          'The link has been copied to your clipboard.'
        );
      } catch {
        Alert.alert(
          "Couldn't open link",
          'Please try again, or visit the partner directly.'
        );
      }
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Image
            source={partner.logo}
            style={styles.logo}
            resizeMode='contain'
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={2}>
            {partner.name}
          </Text>
          <View style={styles.badge}>
            <Feather name='check-circle' size={12} color='#0A7E3F' />
            <Text style={styles.badgeText}>Unify Partner</Text>
          </View>
        </View>
      </View>

      <Text style={styles.tagline}>{partner.tagline}</Text>

      {partner.benefits.length > 0 && (
        <View style={styles.benefits}>
          {partner.benefits.slice(0, 5).map((benefit, idx) => (
            <View key={idx} style={styles.benefitRow}>
              <MaterialCommunityIcons
                name='check'
                size={16}
                color='#0A7E3F'
                style={styles.benefitIcon}
              />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      )}

      {partner.promoCode && (
        <TouchableOpacity
          style={styles.promoRow}
          onPress={handleCopyPromo}
          activeOpacity={0.7}
          accessibilityRole='button'
          accessibilityLabel={`Copy promo code ${partner.promoCode}`}
        >
          <Text style={styles.promoLabel}>Promo code:</Text>
          <Text style={styles.promoCode}>{partner.promoCode}</Text>
          <Feather name='copy' size={14} color='#575757' />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.cta}
        onPress={handleVisit}
        activeOpacity={0.85}
        accessibilityRole='button'
        accessibilityLabel={`${partner.ctaLabel} with ${partner.name}`}
      >
        <Text style={styles.ctaText}>{partner.ctaLabel}</Text>
        <Feather name='arrow-right' size={16} color='#FFFFFF' />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#575757',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  logo: {
    width: 48,
    height: 48,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#343232',
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5EE',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0A7E3F',
    letterSpacing: 0.2,
  },
  tagline: {
    fontSize: 14,
    lineHeight: 20,
    color: '#343232',
    marginBottom: 12,
  },
  benefits: {
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  benefitIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#575757',
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  promoLabel: {
    fontSize: 13,
    color: '#575757',
  },
  promoCode: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#343232',
    letterSpacing: 0.5,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 999,
    paddingVertical: 12,
    gap: 8,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
