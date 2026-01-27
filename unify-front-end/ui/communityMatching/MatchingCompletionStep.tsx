import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '@/constants/Theme';

export function MatchingCompletionStep() {
  return (
    <View style={styles.root}>
      <Text style={styles.headline}>You’re ready to join a circle</Text>
      <Text style={styles.body}>
        We’ll notify you when three other people with the same path are ready,
        then connect you in a 14-day Unify Circle.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.black,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: Theme.textInput,
    textAlign: 'center',
    lineHeight: 22,
  },
});
