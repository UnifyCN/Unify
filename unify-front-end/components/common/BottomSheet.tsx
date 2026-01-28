import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Theme } from '@/constants/Theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CLOSE_THRESHOLD = 100;
const ANIMATION_DURATION = 200;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoint?: number; // 0-1, percentage of screen height the sheet covers
}

export default function BottomSheet({
  visible,
  onClose,
  children,
  snapPoint = 0.65,
}: BottomSheetProps) {
  const sheetHeight = SCREEN_HEIGHT * snapPoint;
  const translateY = useSharedValue(sheetHeight);
  const opacity = useSharedValue(0);
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      // Mount immediately when becoming visible
      setShouldRender(true);
      // Animate to 0 to show the sheet
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
      opacity.value = withTiming(1, { duration: ANIMATION_DURATION });
    } else if (shouldRender) {
      // Animate down to hide the sheet, then unmount
      translateY.value = withSpring(sheetHeight, {
        damping: 20,
        stiffness: 90,
      });
      opacity.value = withTiming(0, { duration: ANIMATION_DURATION });
      // Wait for animation to complete before unmounting
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Slightly longer than animation to ensure completion
      return () => clearTimeout(timeout);
    }
  }, [visible, sheetHeight]);

  const panGesture = Gesture.Pan()
    .onUpdate(event => {
      // Only allow dragging down (positive translationY)
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd(event => {
      const shouldClose =
        event.translationY > CLOSE_THRESHOLD || event.velocityY > 500;

      if (shouldClose) {
        translateY.value = withSpring(sheetHeight, {
          damping: 20,
          stiffness: 90,
        });
        opacity.value = withTiming(0, { duration: ANIMATION_DURATION });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 90,
        });
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const animatedBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  if (!shouldRender) return null;

  return (
    <Modal
      visible={shouldRender}
      transparent
      animationType='none'
      statusBarTranslucent
      onRequestClose={onClose}
      presentationStyle='overFullScreen'
    >
      <GestureHandlerRootView style={styles.container}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, animatedBackdropStyle]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.sheet, { height: sheetHeight }, animatedSheetStyle]}
        >
          <GestureDetector gesture={panGesture}>
            <Animated.View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </Animated.View>
          </GestureDetector>
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dragHandleContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Theme.borderInfoText,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
});
