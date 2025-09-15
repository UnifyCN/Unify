import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated } from 'react-native';

type CardItem = {
  id: string;
  front: string;
  back: string;
};

export default function FlashcardsCarousel({ items }: { items: CardItem[] }) {
  const { width } = Dimensions.get('window');
  const [index, setIndex] = React.useState(0);
  const scrollRef = React.useRef<any>(null);

  const onMomentumEnd = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  return (
    <View>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
      >
        {items.map((item) => (
          <View key={item.id} style={{ width, paddingHorizontal: 20 }}>
            <FlippableCard front={item.front} back={item.back} />
          </View>
        ))}
      </Animated.ScrollView>
      <View style={styles.paginationRow}>
        {items.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />)
        )}
      </View>
    </View>
  );
}

function FlippableCard({ front, back }: { front: string; back: string }) {
  const animated = React.useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = React.useState(false);

  const flipTo = (to: number) => {
    Animated.spring(animated, { toValue: to, useNativeDriver: true, friction: 8, tension: 10 }).start();
  };

  const onPress = () => {
    const next = !flipped;
    setFlipped(next);
    flipTo(next ? 1 : 0);
  };

  const rotateY = animated.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const rotateYBack = animated.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <View style={styles.cardWrapper}>
        <Animated.View style={[styles.card, styles.cardFront, { transform: [{ rotateY }] }]}> 
          <Text style={styles.cardText}>{front}</Text>
        </Animated.View>
        <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: rotateYBack }] }]}> 
          <Text style={styles.cardText}>{back}</Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    height: 220,
    perspective: 1000,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden' as any,
  },
  cardFront: {},
  cardBack: {
    backgroundColor: '#D1D5DB',
  },
  cardText: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  dotActive: { backgroundColor: '#111827' },
});


