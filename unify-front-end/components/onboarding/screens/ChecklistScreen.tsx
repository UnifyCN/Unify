import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Figma artboard is 393px. Cap scale so cards stay compact on larger phones.
const FIGMA_WIDTH = 393;
const S = Math.min(SCREEN_WIDTH / FIGMA_WIDTH, 1.05);

// Figma positions (in 393px frame):
// Checklist card: x=34, y=126, w=271, h~380
// Modal card:     x=127, y=306, w=236, h=226
//
// Container origin at (34, 126):
//   Checklist: left=0, top=0
//   Modal:     left=93, top=180
// Container: w=330, h=406

const CONTAINER_W = 330 * S;
const CONTAINER_H = 406 * S;

export default function ChecklistScreen() {
  return (
    <View style={styles.container}>
      <View style={[styles.cardsContainer, { width: CONTAINER_W, height: CONTAINER_H }]}>
        {/* Checklist card — left side, main card */}
        <View style={[styles.cardPosition, { left: 0, top: 0, zIndex: 1 }]}>
          <Image
            source={require('@/assets/images/checklist-card.png')}
            style={{
              width: 271 * S,
              height: 380 * S,
              borderRadius: 12 * S,
            }}
            contentFit="contain"
          />
        </View>

        {/* Modal card — overlaps right side */}
        <View style={[styles.cardPosition, { left: 93 * S, top: 180 * S, zIndex: 2 }]}>
          <View style={[styles.modalCardShadow, { borderRadius: 25 * S }]}>
            <Image
              source={require('@/assets/images/checklist-modal-card.png')}
              style={{
                width: 236 * S,
                height: 226 * S,
                borderRadius: 25 * S,
              }}
              contentFit="contain"
            />
          </View>
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>Know What to Do Next</Text>
        <Text style={styles.description}>
          Get a personalized settlement checklist for your situation, and move
          forward step-by-step with more clarity and less stress.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  cardPosition: {
    position: 'absolute',
  },
  modalCardShadow: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  textContainer: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  title: {
    fontFamily: 'FunnelSans_600SemiBold',
    fontSize: 24,
    lineHeight: 30,
    color: '#000',
    textAlign: 'center',
  },
  description: {
    fontFamily: 'FunnelSans_400Regular',
    fontSize: 16,
    lineHeight: 20,
    color: '#000',
    textAlign: 'center',
    maxWidth: 313,
  },
});
