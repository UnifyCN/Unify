import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';

type Props = {
  total: number;
  activeIndex: number;
  onDotPress?: (index: number) => void;
};

export default function CarouselDots({
  total,
  activeIndex,
  onDotPress,
}: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <Pressable
          key={i}
          onPress={() => onDotPress && onDotPress(i)}
          android_ripple={{ color: '#ddd', borderless: true }}
          style={[
            styles.dot,
            i === activeIndex ? styles.dotActive : styles.dotInactive,
          ]}
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
