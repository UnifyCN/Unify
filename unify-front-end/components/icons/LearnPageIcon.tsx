import React from 'react';
import { Image} from 'react-native';

interface CustomIconProps {
  name: string;
  color: string;
  focused: boolean;
}

const icon = {
  focused: require('@/assets/images/LearnPageFocused.svg'),
  default: require('@/assets/images/LearnPage.svg'),
};

export default function CustomLearnIcon({
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