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

  const goTo = (i: number) => {
    if (i < 0 || i >= items.length) return;
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  };

  const onMomentumEnd = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  return (
    <View style={styles.carouselContainer}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEnabled={false}
      >
        {items.map((item) => (
          <View key={item.id} style={styles.cardOuterWrap}>
            <FlippableCard front={item.front} back={item.back} />
          </View>
        ))}
      </Animated.ScrollView>
      <View style={styles.indicatorRow}>
        <Text style={styles.indicatorText}>{`${index + 1}/${items.length}`}</Text>
      </View>
      <View style={styles.arrowRow}>
        <TouchableOpacity
          style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
          disabled={index === 0}
          onPress={() => goTo(index - 1)}
        >
          <View style={styles.arrowCircle}><Text style={styles.arrowIcon}>{'◀'}</Text></View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.arrowBtn, index === items.length - 1 && styles.arrowBtnDisabled]}
          disabled={index === items.length - 1}
          onPress={() => goTo(index + 1)}
        >
          <View style={styles.arrowCircle}><Text style={styles.arrowIcon}>{'▶'}</Text></View>
        </TouchableOpacity>
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
  carouselContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  cardOuterWrap: {
    width: Dimensions.get('window').width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  cardWrapper: {
    width: 260,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    perspective: '1000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
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
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 16,
    color: '#222',
  },
  indicatorRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  indicatorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  arrowRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
    marginBottom: 8,
  },
  arrowBtn: {
    opacity: 1,
  },
  arrowBtnDisabled: {
    opacity: 0.5,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  arrowIcon: {
    fontSize: 22,
    color: '#444',
    fontWeight: '700',
  },
});


