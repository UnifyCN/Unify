import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
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
  useModal?: boolean;
}

export default function BottomSheet({
  visible,
  onClose,
  children,
  snapPoint = 0.65,
  useModal = true,
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
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, { duration: ANIMATION_DURATION });
    } else if (shouldRender) {
      // Animate down to hide the sheet, then unmount
      translateY.value = withTiming(sheetHeight, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(0, { duration: 250 });
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
        translateY.value = withTiming(sheetHeight, {
          duration: 250,
          easing: Easing.in(Easing.cubic),
        });
        opacity.value = withTiming(0, { duration: 250 });
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
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

  const sheetContent = (
    <GestureHandlerRootView style={styles.container}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]} />
      </TouchableWithoutFeedback>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.sheet, { height: sheetHeight }, animatedSheetStyle]}
        >
          <View style={styles.dragHandle} />
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );

  if (!useModal) {
    return <View style={styles.inlineContainer}>{sheetContent}</View>;
  }

  return (
    <Modal
      visible={shouldRender}
      transparent
      animationType='none'
      statusBarTranslucent
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <GestureHandlerRootView style={styles.container}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, animatedBackdropStyle]} />
        </TouchableWithoutFeedback>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[styles.sheet, { height: sheetHeight }, animatedSheetStyle]}
          >
            <View style={styles.dragHandle} />
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inlineContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
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
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Theme.borderInfoText,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
});
