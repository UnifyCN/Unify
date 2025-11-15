import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

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
    <TouchableOpacity style={[styles.searchButton, style]} onPress={onPress}>
      <Feather name='search' size={iconSize} color={iconColor} />
      <Text style={[styles.searchPlaceholder, placeholderStyle]}>
        {placeholder}
      </Text>
    </TouchableOpacity>
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
