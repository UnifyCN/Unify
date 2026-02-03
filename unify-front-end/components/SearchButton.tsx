import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import AnimatedPressable from '@/components/common/AnimatedPressable';

interface SearchButtonProps {
  placeholder?: string;
  onPress: () => void;
  style?: ViewStyle;
  placeholderStyle?: TextStyle;
  iconSize?: number;
  iconColor?: string;
}

export default function SearchButton({
  placeholder = 'Search for posts and groups',
  onPress,
  style,
  placeholderStyle,
  iconSize = 20,
  iconColor = Theme.textInput,
}: SearchButtonProps) {
  return (
    <AnimatedPressable style={[styles.searchButton, style]} onPress={onPress}>
      <Feather name='search' size={iconSize} color={iconColor} />
      <Text style={[styles.searchPlaceholder, placeholderStyle]}>
        {placeholder}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surfaceTextInput,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    gap: 15,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: Theme.textAlternateGray,
  },
});
