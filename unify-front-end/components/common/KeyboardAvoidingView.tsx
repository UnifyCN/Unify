import React from 'react';
import {
  KeyboardAvoidingView as RNKCKeyboardAvoidingView,
  type KeyboardAvoidingViewProps,
} from 'react-native-keyboard-controller';

type Props = Omit<KeyboardAvoidingViewProps, 'behavior'> & {
  behavior?: 'height' | 'padding' | 'translate-with-padding';
};

const KeyboardAvoidingView = ({
  behavior = 'translate-with-padding',
  contentContainerStyle: _contentContainerStyle,
  ...rest
}: Props) => {
  return <RNKCKeyboardAvoidingView behavior={behavior} {...rest} />;
};

export default KeyboardAvoidingView;
