import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Theme } from '@/constants/Theme';
import { useReferralCounter } from '@/hooks/referrals/useReferralCounter';

/**
 * Silent counter for the invite screen. NEVER displays a leaderboard or rank.
 *  - Loading / error / 0 joins: render nothing (counter is opt-in feedback,
 *    never a CTA-shaped prompt that could confuse the user).
 *  - >= 1 join: "N friends have joined Unify thanks to you."
 *
 * Why a single metric: a referrals row only exists after a successful redeem,
 * so the underlying count is "joined" — there's no separate "sent invites"
 * counter (we don't track outbound share-sheet events in the DB). Showing
 * invited === joined as two separate numbers was misleading. If we ever add
 * a sent-invites table, this can grow back to two metrics.
 */
export function ReferralCounter() {
  const { data, isLoading, isError } = useReferralCounter();

  if (isError || isLoading || !data || data.joined === 0) return null;

  const friendWord = data.joined === 1 ? 'friend' : 'friends';
  const haveWord = data.joined === 1 ? 'has' : 'have';

  return (
    <View style={styles.wrap}>
      <Text
        style={styles.text}
        accessibilityLabel={`${data.joined} ${friendWord} ${haveWord} joined Unify thanks to you.`}
      >
        {data.joined} {friendWord} {haveWord} joined Unify thanks to you.
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
