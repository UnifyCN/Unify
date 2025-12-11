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
  if (total <= 1) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.dotsWrapper}>
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === activeIndex;
          return (
            <Pressable
              key={`dot-${i}`}
              onPress={() => onDotPress && onDotPress(i)}
              android_ripple={{ color: '#ddd', borderless: true }}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <View
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                  i < total - 1 && styles.itemSpacing,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 4,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 5,
    backgroundColor: '#d0d0d0',
  },
  dotActive: {
    width: 23,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#9B9797',
  },
  dotInactive: { 
    backgroundColor: '#d0d0d0',
  },
  itemSpacing: { 
    marginRight: 6,
  },
});
