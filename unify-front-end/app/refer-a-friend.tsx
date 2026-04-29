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
 *   ┌────────────────────┐
 *   │ ← Refer a friend   │
 *   ├────────────────────┤
 *   │ headline + subhead │
 *   │ invite-code box    │  tap to copy + haptic
 *   │ Invite a friend ▶  │  primary orange CTA, opens share sheet
 *   │ counter            │  silent, never leaderboard
 *   └────────────────────┘
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

        <Pressable
          onPress={handleCopy}
          disabled={!code}
          style={({ pressed }) => [
            styles.codeBox,
            pressed && styles.codeBoxPressed,
            !code && styles.codeBoxDisabled,
          ]}
          accessibilityRole='button'
          accessibilityLabel={
            code ? `Your invite code: ${code}. Tap to copy.` : 'Loading invite code'
          }
        >
          {loading || !code ? (
            <ActivityIndicator color={Theme.primaryGatherRed} />
          ) : (
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{code}</Text>
              <Feather name='copy' size={18} color={Theme.textAlternateGray} />
            </View>
          )}
        </Pressable>

        {error ? (
          <Text style={styles.errorText}>
            Couldn&apos;t generate your invite link. Pull down or revisit to retry.
          </Text>
        ) : null}

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
  codeBox: {
    minHeight: 80,
    borderRadius: 14,
    backgroundColor: '#FAF6F0', // soft cream tint, scoped to component
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  codeBoxPressed: { opacity: 0.7 },
  codeBoxDisabled: { opacity: 0.5 },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeText: {
    fontSize: 32,
    letterSpacing: 6,
    fontFamily: 'monospace',
    color: Theme.black,
    fontWeight: '700',
  },
  errorText: {
    color: Theme.destructive,
    fontSize: 14,
    textAlign: 'center',
  },
  primaryCta: {
    height: 56,
    borderRadius: 14,
    backgroundColor: Theme.primaryGatherRed,
    alignItems: 'center',
    justifyContent: 'center',
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
});
