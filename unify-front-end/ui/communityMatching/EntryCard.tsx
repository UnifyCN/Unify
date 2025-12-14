import { StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface EntryCardProps {
  onPress: () => void;
}

export function CommunityMatchingEntryCard({ onPress }: EntryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.title}>Unify Circles</Text>
        <Text style={styles.subtitle}>
          Be matched into 14-day Circles with people on the same newcomer path.
        </Text>
      </View>
      <TouchableOpacity style={styles.ctaButton} onPress={onPress}>
        <Text style={styles.ctaText}>Find my circle</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 12,
  },
  copy: {
    gap: 6,
  },
  label: {
    color: '#588DD1',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A1B00',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  ctaButton: {
    marginTop: 4,
    backgroundColor: '#588DD1',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
