import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface CustomIconProps {
  name: string;
  color: string;
  focused: boolean;
}

const icon = {
  focused: require('@/assets/images/ProfilePageFocused.svg'),
  default: require('@/assets/images/ProfilePage.svg'),
};

export default function CustomProfileIcon({
  name,
  color,
  focused
}: CustomIconProps) {
  return (
    <Image 
      source={
        focused
          ? icon.focused
          : icon.default
      }
      style={{ tintColor: color}}
    />
  )
}