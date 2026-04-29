import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Theme } from '@/constants/Theme';
import { useReferralCounter } from '@/hooks/referrals/useReferralCounter';

/**
 * Silent counter for the invite screen. NEVER displays a leaderboard or rank.
 *  - Loading / error / 0 invites: render nothing (counter is opt-in feedback,
 *    never a CTA-shaped prompt that could confuse the user).
 *  - >= 1 invite: "You've invited N friends. M have joined."
 */
export function ReferralCounter() {
  const { data, isLoading, isError } = useReferralCounter();

  if (isError || isLoading || !data || data.invited === 0) return null;

  const friendWord = data.invited === 1 ? 'friend' : 'friends';
  const joinedVerb = data.joined === 1 ? 'has' : 'have';

  return (
    <View style={styles.wrap}>
      <Text
        style={styles.text}
        accessibilityLabel={`You have invited ${data.invited} ${friendWord}. ${data.joined} ${joinedVerb} joined.`}
      >
        You&apos;ve invited {data.invited} {friendWord}. {data.joined} {joinedVerb} joined.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    paddingVertical: 12,
  },
  text: {
    fontSize: 14,
    color: Theme.textAlternateGray,
    textAlign: 'center',
  },
});
