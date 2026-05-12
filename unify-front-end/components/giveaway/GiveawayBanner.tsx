import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  AccessibilityInfo,
} from 'react-native';
import { ChevronRight, Gift, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Theme } from '@/constants/Theme';
import { useGiveawayCountdown } from '@/hooks/giveaway/useGiveawayCountdown';
import { useGiveawayEntry } from '@/hooks/giveaway/useGiveawayEntry';
import { useAnalytics, AnalyticsEvents } from '@/utils/analytics';
import { useHapticsPreference } from '@/context/HapticsContext';
import * as Haptics from 'expo-haptics';

/**
 * GiveawayBanner — pinned above the feed tabs on Home.
 *
 *   Three states:
 *     1. active & not entered     → tap CTA + dismiss X
 *     2. active & entered         → "You're entered ✓" (no dismiss)
 *     3. expired or dismissed     → null
 *
 * Dismissal is per-session (component-local state). Re-mounts on next app
 * launch, so users who closed without entering see it again.
 */
export function GiveawayBanner() {
  const { t } = useTranslation();
  const router = useRouter();
  const { capture } = useAnalytics();
  const { hapticsEnabled } = useHapticsPreference();
  const { isActive } = useGiveawayCountdown();
  const { data: entry, isLoading } = useGiveawayEntry();
  const [dismissed, setDismissed] = useState(false);
  const [hasFiredShown, setHasFiredShown] = useState(false);

  const hasEntered = !!entry;
  const shouldRender = isActive && !dismissed;

  useEffect(() => {
    // Fire banner_shown once per mount when the banner first becomes visible
    // and we know the user's entry state.
    if (!shouldRender || isLoading || hasFiredShown) return;
    capture(AnalyticsEvents.GIVEAWAY_BANNER_SHOWN, {
      state: hasEntered ? 'entered' : 'cta',
    });
    setHasFiredShown(true);
  }, [shouldRender, isLoading, hasFiredShown, hasEntered, capture]);

  if (!shouldRender) return null;

  if (hasEntered) {
    return (
      <View style={styles.outerWrap}>
        <View
          style={styles.card}
          accessibilityRole='text'
          accessibilityLabel={`${t('giveaway.banner.enteredHeadline')} ${t(
            'giveaway.banner.enteredSubtext'
          )}`}
        >
          <Gift color={Theme.black} size={18} strokeWidth={2.2} />
          <View style={styles.textBlock}>
            <Text style={styles.headline} numberOfLines={1}>
              {t('giveaway.banner.enteredHeadline')}
            </Text>
            <Text style={styles.subtext} numberOfLines={1}>
              {t('giveaway.banner.enteredSubtext')}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const handlePress = () => {
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    capture(AnalyticsEvents.GIVEAWAY_BANNER_TAPPED);
    router.push('/giveaway' as never);
  };

  const handleDismiss = () => {
    capture(AnalyticsEvents.GIVEAWAY_BANNER_DISMISSED);
    setDismissed(true);
    AccessibilityInfo.announceForAccessibility(
      t('giveaway.banner.headline')
    );
  };

  return (
    <View style={styles.outerWrap}>
      <View style={styles.card}>
        <Pressable
          style={({ pressed }) => [
            styles.pressArea,
            pressed && styles.pressed,
          ]}
          onPress={handlePress}
          accessibilityRole='button'
          accessibilityLabel={t('giveaway.banner.headline')}
          accessibilityHint={t('giveaway.welcome.cta')}
        >
          <Gift color={Theme.black} size={18} strokeWidth={2.2} />
          <Text style={styles.headline} numberOfLines={1}>
            {t('giveaway.banner.headline')}
          </Text>
          <View style={styles.divider} />
          <CountdownInline />
          <ChevronRight color={Theme.textAlternateGray} size={16} strokeWidth={2.2} />
        </Pressable>
        <Pressable
          onPress={handleDismiss}
          hitSlop={12}
          style={({ pressed }) => [
            styles.dismissButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole='button'
          accessibilityLabel={t('common.cancel')}
        >
          <X color={Theme.textInactiveTab} size={15} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

// Inline countdown — pulls the banner's neutral palette and keeps the
// type scale tight against the headline.
function CountdownInline() {
  const { t } = useTranslation();
  const { isActive, display } = useGiveawayCountdown();
  if (!isActive) return null;
  return (
    <Text style={styles.countdown} numberOfLines={1}>
      {t('giveaway.banner.countdownPrefix')} {display}
    </Text>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.white,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.borderCard,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minHeight: 48,
  },
  pressArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textBlock: {
    flex: 1,
    flexDirection: 'column',
    marginLeft: 8,
  },
  headline: {
    color: Theme.black,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  subtext: {
    color: Theme.textAlternateGray,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 14,
    backgroundColor: Theme.borderCard,
    marginHorizontal: 4,
  },
  countdown: {
    color: Theme.textAlternateGray,
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  dismissButton: {
    paddingLeft: 10,
    paddingVertical: 4,
  },
  pressed: {
    opacity: 0.6,
  },
});
