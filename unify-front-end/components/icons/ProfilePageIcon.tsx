import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface CustomIconProps {
  name: string;
  color: string;
  focused: boolean;
}

const CustomProfileIcon: React.FC<CustomIconProps> = ({ color, focused }) => (
  <Image
    source={
      focused
        ? require('@/assets/images/ProfilePageFocused.svg')
        : require('@/assets/images/ProfilePage.svg')
    }
    style={{ tintColor: color, width: 24, height: 24 } as StyleProp<ImageStyle>}
  />
);

export default CustomProfileIcon;