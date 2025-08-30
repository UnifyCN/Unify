import React from 'react';
import { View, StyleSheet } from 'react-native';

type Props = { total: number; activeIndex: number };

export default function CarouselDots({ total, activeIndex }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 22, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: '#c0c0c0' },
  dotInactive: { backgroundColor: '#e0e0e0' },
});
