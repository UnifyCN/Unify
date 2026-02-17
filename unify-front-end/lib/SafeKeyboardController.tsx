import React from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';

// Try to require the native keyboard-controller at runtime so bundlers
// running in Expo Go or environments without the native module won't fail.
let NativeKeyboardController: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  NativeKeyboardController = require('react-native-keyboard-controller');
} catch (e) {
  NativeKeyboardController = null;
}

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  if (NativeKeyboardController && NativeKeyboardController.KeyboardProvider) {
    const KP =
      NativeKeyboardController.KeyboardProvider as React.ComponentType<any>;
    return <KP>{children}</KP>;
  }
  return <>{children}</>;
}

type Offset = { opened?: number; closed?: number };
export function KeyboardStickyView(props: {
  children?: React.ReactNode;
  style?: any;
  offset?: Offset;
}) {
  if (NativeKeyboardController && NativeKeyboardController.KeyboardStickyView) {
    const KSV =
      NativeKeyboardController.KeyboardStickyView as React.ComponentType<any>;
    return <KSV {...props} />;
  }

  // Fallback: basic KeyboardAvoidingView to provide acceptable behaviour
  const keyboardOffset = props?.offset?.opened ?? props?.offset?.closed ?? 0;
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardOffset}
      style={props.style}
    >
      <View>{props.children}</View>
    </KeyboardAvoidingView>
  );
}

export default {
  KeyboardProvider,
  KeyboardStickyView,
};
