import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function LessonHeroCard() {
  return (
    <View style={styles.card}>
      <View style={styles.banner} />
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Finance • 6 Lessons</Text>
      </View>
      <Text style={styles.title}>Mastering Banking in Canada</Text>

      <View style={styles.footerRow}>
        <View>
          <Text style={styles.caption}>Continue from Lesson 2:</Text>
          <Text style={styles.subtitle}>Types of Banks & Credit Unions</Text>
        </View>
        <View style={styles.playButton}>
          <Feather name='play' size={18} color='#fff' />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  banner: {
    height: 160,
    borderRadius: 12,
    backgroundColor: '#c7c7c7',
    marginBottom: 12,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: '#7a7a7a', fontSize: 12 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 6,
  },
  footerRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caption: { color: '#7a7a7a', fontSize: 12 },
  subtitle: { color: '#000', fontSize: 14, fontWeight: '600', maxWidth: 220 },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
