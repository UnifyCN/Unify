import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSelection } from '@/context/SelectionContext';

interface SelectionActionBubbleProps {
  onHighlight: () => void;
  onRemoveHighlight: () => void;
  onAskAI: () => void;
}

const BUBBLE_WIDTH = 200;
const BUBBLE_HEIGHT = 44;
const ARROW_SIZE = 8;
const SCREEN_PADDING = 16;

export default function SelectionActionBubble({
  onHighlight,
  onRemoveHighlight,
  onAskAI,
}: SelectionActionBubbleProps) {
  const { selection } = useSelection();
  const screenWidth = Dimensions.get('window').width;

  if (selection.mode !== 'selected' || !selection.startWord) return null;

  const isHighlighted = !!selection.existingHighlight;

  const anchorX = selection.startWord.pageX;
  const anchorY = selection.startWord.pageY;

  let bubbleLeft = anchorX - BUBBLE_WIDTH / 2;
  bubbleLeft = Math.max(SCREEN_PADDING, bubbleLeft);
  bubbleLeft = Math.min(screenWidth - BUBBLE_WIDTH - SCREEN_PADDING, bubbleLeft);

  const bubbleTop = anchorY - BUBBLE_HEIGHT - ARROW_SIZE - 8;

  return (
    <View
      style={[
        styles.container,
        { top: bubbleTop, left: bubbleLeft },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.bubble}>
        <TouchableOpacity
          style={styles.button}
          onPress={isHighlighted ? onRemoveHighlight : onHighlight}
          activeOpacity={0.7}
        >
          <Feather
            name={isHighlighted ? 'x' : 'edit-3'}
            size={16}
            color="#fff"
          />
          <Text style={styles.buttonText}>
            {isHighlighted ? 'Remove' : 'Highlight'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.button}
          onPress={onAskAI}
          activeOpacity={0.7}
        >
          <Feather name="help-circle" size={16} color="#fff" />
          <Text style={styles.buttonText}>Ask AI</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.arrow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
    alignItems: 'center',
  },
  bubble: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1F2937',
  },
});
