import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = { title: string; modulesLabel: string };

export default function PathwayCard({ title, modulesLabel }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.thumb} />
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.meta}>{modulesLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  thumb: {
    width: '100%',
    height: 100,
    backgroundColor: '#d9d9d9',
    borderRadius: 10,
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: '600', color: '#000' },
  meta: { marginTop: 6, fontSize: 12, color: '#666' },
});
