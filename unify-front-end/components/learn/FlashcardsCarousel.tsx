import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';

type CardItem = {
  id: string;
  front: string;
  back: string;
};

export default function FlashcardsCarousel({ items }: { items: CardItem[] }) {
  const [index, setIndex] = React.useState(0);

  // If the items array changes (new lesson or contents), keep the index in-sync
  React.useEffect(() => {
    if (!items || items.length === 0) {
      setIndex(0);
      return;
    }
    // clamp index if it's out of range after items change
    if (index >= items.length) {
      setIndex(items.length - 1);
    }
  }, [items, index]);

  const goTo = (i: number) => {
    if (!items || items.length === 0) return;
    const next = Math.max(0, Math.min(i, items.length - 1));
    setIndex(next);
  };

  // Defensive: currentItem may be undefined if items is empty; provide a safe fallback
  const currentItem =
    items && items.length > 0
      ? items[index]
      : { id: 'empty', front: '', back: '' };

  return (
    <View style={styles.carouselContainer}>
      {/* Display only the current card */}
      <View style={styles.cardOuterWrap}>
        <FlippableCard front={currentItem.front} back={currentItem.back} />
      </View>

      <View style={styles.indicatorRow}>
        <Text
          style={styles.indicatorText}
        >{`${index + 1}/${items.length}`}</Text>
      </View>

      <View style={styles.arrowRow}>
        <TouchableOpacity
          style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
          disabled={index === 0}
          onPress={() => goTo(index - 1)}
        >
          <View style={styles.arrowCircle}>
            <Text style={styles.arrowIcon}>{'◀'}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.arrowBtn,
            index === items.length - 1 && styles.arrowBtnDisabled,
          ]}
          disabled={index === items.length - 1}
          onPress={() => goTo(index + 1)}
        >
          <View style={styles.arrowCircle}>
            <Text style={styles.arrowIcon}>{'▶'}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FlippableCard({ front, back }: { front: string; back: string }) {
  const animated = React.useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = React.useState(false);

  const flipTo = (to: number) => {
    Animated.spring(animated, {
      toValue: to,
      useNativeDriver: true,
      friction: 8,
      tension: 10,
    }).start();
  };

  const onPress = () => {
    const next = !flipped;
    setFlipped(next);
    flipTo(next ? 1 : 0);
  };

  const rotateY = animated.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const rotateYBack = animated.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <View style={styles.cardWrapper}>
        <Animated.View
          style={[styles.card, styles.cardFront, { transform: [{ rotateY }] }]}
        >
          <Text style={styles.cardText}>{front}</Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            { transform: [{ rotateY: rotateYBack }] },
          ]}
        >
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
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
  },
  cardOuterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardWrapper: {
    width: Dimensions.get('window').width - 40,
    height: 280,
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
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 24,
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
