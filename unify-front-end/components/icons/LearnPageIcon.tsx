import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface CustomIconProps {
  color: string;
  focused: boolean;
}

const CustomLearnIcon: React.FC<CustomIconProps> = ({ color, focused }) => (
  <Image
    source={focused ? require('../../assets/images/LearnPage.png') : require('../../assets/images/LearnPage.png')}
    style={{ tintColor: color, width: 24, height: 24 } as StyleProp<ImageStyle>}
  />
);

export default CustomLearnIcon;