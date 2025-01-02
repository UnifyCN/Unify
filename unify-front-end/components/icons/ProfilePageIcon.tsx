import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import SVGProfilePageIcon from '@/assets/images/ProfilePage.svg';
import SVGProfilePageIconFocused from '@/assets/images/ProfilePageFocused.svg';

interface CustomIconProps {
  name: string;
  color: string;
  focused: boolean;
}

export default function CustomProfileIcon({
  name,
  color,
  focused
}: CustomIconProps) {
  return (
    <>
      {focused ? (
        <SVGProfilePageIconFocused fill={color} />
      ) : (
        <SVGProfilePageIcon fill={color} />
      )}
    </>
  )
}