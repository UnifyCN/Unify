import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function LessonHeroCard() {
  return (
    <View style={styles.card}>
      <View style={styles.banner}>
        <View style={styles.bannerTextWrap}>
          <Text style={styles.metaText}>Finance • 6 Sections</Text>
          <Text style={styles.title}>Mastering Banking in Canada</Text>
        </View>
      </View>

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
    // make banner flush with card edges
    marginHorizontal: -16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#bdbdbd',
    marginBottom: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 20,
  },
  bannerTextWrap: {
    // place text at the bottom-left inside the banner
    alignSelf: 'flex-start',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: 'rgba(255,255,255,0.95)', fontSize: 13, marginBottom: 6 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  footerRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    // subtle top shadow to separate from banner
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
  },
  caption: { color: '#7a7a7a', fontSize: 12 },
  subtitle: { color: '#000', fontSize: 16, fontWeight: '700', maxWidth: 240 },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
