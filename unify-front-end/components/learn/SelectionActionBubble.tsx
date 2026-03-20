import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSelection } from '@/context/SelectionContext';

interface SelectionActionBubbleProps {
  onHighlight: () => void;
  onRemoveHighlight: () => void;
  onAskAI: () => void;
}

const BUBBLE_HEIGHT = 44;
const ARROW_SIZE = 8;
const SCREEN_PADDING = 16;

export default function SelectionActionBubble({
  onHighlight,
  onRemoveHighlight,
  onAskAI,
}: SelectionActionBubbleProps) {
  const { selection, clearSelection } = useSelection();
  const screenWidth = Dimensions.get('window').width;

  if (selection.mode !== 'selected' || !selection.startWord) return null;

  const isHighlighted = !!selection.existingHighlight;

  const anchorX = selection.startWord.pageX;
  const anchorY = selection.startWord.pageY;

  // Center horizontally, clamped to screen
  let bubbleLeft = Math.max(SCREEN_PADDING, anchorX - 100);
  bubbleLeft = Math.min(screenWidth - 200 - SCREEN_PADDING, bubbleLeft);

  // Position above the word
  const bubbleTop = anchorY - BUBBLE_HEIGHT - ARROW_SIZE - 12;

  return (
    <Modal transparent visible animationType="none" onRequestClose={clearSelection}>
      {/* Tapping the backdrop dismisses the selection */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={clearSelection}
      >
        <View
          style={[styles.container, { top: bubbleTop, left: bubbleLeft }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
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
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
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
    alignSelf: 'center',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1F2937',
  },
});
