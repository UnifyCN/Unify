import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import BackHeader from '@/components/BackHeader';
import { Theme } from '@/constants/Theme';
import { useInvite } from '@/hooks/referrals/useInvite';
import { ReferralCounter } from '@/components/referrals/ReferralCounter';
import { useAnalytics, AnalyticsEvents } from '@/utils/analytics';

/**
 * /refer-a-friend — settings sub-route.
 *
 *   ┌────────────────────────────────────┐
 *   │ ← Refer a friend                    │
 *   ├────────────────────────────────────┤
 *   │ headline + subhead                  │
 *   │                                     │
 *   │ ┌─────────────────────────────────┐ │  primary anchor: tap → share
 *   │ │      Invite a friend            │ │  sheet handles everything;
 *   │ └─────────────────────────────────┘ │  code is auto-clipboarded.
 *   │                                     │
 *   │ Your code (small explainer)         │
 *   │ ┌─────────────────────────────────┐ │  smaller pill, fallback only:
 *   │ │ YQAR67                  📋      │ │  verbal sharing or manual entry
 *   │ └─────────────────────────────────┘ │  if clipboard misses.
 *   │                                     │
 *   │ counter (only if > 0 invites)       │
 *   └────────────────────────────────────┘
 */
export default function ReferAFriendScreen() {
  const router = useRouter();
  const { code, loading, error, invite, inviting } = useInvite();
  const { capture } = useAnalytics();

  useEffect(() => {
    capture(AnalyticsEvents.INVITE_SCREEN_OPENED, {});
  }, [capture]);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await Clipboard.setStringAsync(code);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // haptics is best-effort
      }
    } catch (err) {
      console.warn('refer-a-friend: copy failed', err);
    }
  };

  const isAndroid = Platform.OS !== 'ios';

  return (
    <View style={styles.container}>
      <BackHeader title='Refer a friend' onBack={() => router.back()} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.headline}>
          Invite a friend to start their Canada journey with you.
        </Text>
        <Text style={styles.subhead}>
          Newcomers do best when they have a friend already inside.
        </Text>

        <TouchableOpacity
          onPress={invite}
          disabled={!code || inviting || isAndroid}
          activeOpacity={0.85}
          style={[
            styles.primaryCta,
            (!code || inviting || isAndroid) && styles.primaryCtaDisabled,
          ]}
          accessibilityRole='button'
          accessibilityLabel='Invite a friend'
        >
          {inviting ? (
            <ActivityIndicator color={Theme.white} />
          ) : (
            <Text style={styles.primaryCtaText}>Invite a friend</Text>
          )}
        </TouchableOpacity>

        {isAndroid ? (
          <Text style={styles.androidNotice}>
            Referrals are only available on iOS for now.
          </Text>
        ) : null}

        {error ? (
          <Text style={styles.errorText}>
            Couldn&apos;t generate your invite link. Pull down or revisit to retry.
          </Text>
        ) : null}

        {/* Code section — secondary, fallback-only. The Invite button does this for you;
            this is for verbal sharing or for friends who type the code manually. */}
        <View style={styles.codeSection}>
          <Text style={styles.codeSectionLabel}>Your invite code</Text>
          <Text style={styles.codeSectionExplainer}>
            Friends who tap your invite link are linked to you automatically. They can
            also type this code during signup if needed.
          </Text>

          <Pressable
            onPress={handleCopy}
            disabled={!code}
            style={({ pressed }) => [
              styles.codePill,
              pressed && styles.codePillPressed,
              !code && styles.codePillDisabled,
            ]}
            accessibilityRole='button'
            accessibilityLabel={
              code ? `Your invite code: ${code}. Tap to copy.` : 'Loading invite code'
            }
          >
            {loading || !code ? (
              <ActivityIndicator color={Theme.primaryGatherRed} size='small' />
            ) : (
              <>
                <Text style={styles.codePillText}>{code}</Text>
                <Feather name='copy' size={16} color={Theme.textAlternateGray} />
              </>
            )}
          </Pressable>
        </View>

        <ReferralCounter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.white },
  content: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  headline: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    color: Theme.black,
  },
  subhead: {
    fontSize: 16,
    lineHeight: 22,
    color: Theme.textAlternateGray,
  },
  primaryCta: {
    height: 56,
    borderRadius: 14,
    backgroundColor: Theme.primaryGatherRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryCtaDisabled: { backgroundColor: Theme.disabledGatherRed },
  primaryCtaText: {
    color: Theme.white,
    fontSize: 16,
    fontWeight: '700',
  },
  androidNotice: {
    fontSize: 13,
    color: Theme.textPostTime,
    textAlign: 'center',
  },
  errorText: {
    color: Theme.destructive,
    fontSize: 14,
    textAlign: 'center',
  },
  codeSection: {
    marginTop: 16,
    gap: 8,
  },
  codeSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.textAlternateGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeSectionExplainer: {
    fontSize: 13,
    lineHeight: 18,
    color: Theme.textPostTime,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#FAF6F0',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  codePillPressed: { opacity: 0.6 },
  codePillDisabled: { opacity: 0.5 },
  codePillText: {
    fontSize: 18,
    letterSpacing: 3,
    fontFamily: 'monospace',
    color: Theme.black,
    fontWeight: '600',
  },
});
