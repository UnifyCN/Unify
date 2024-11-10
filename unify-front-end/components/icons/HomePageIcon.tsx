import React from 'react';
import { View, Image, ImageStyle, StyleProp } from 'react-native';

interface CustomIconProps {
  name: string;
  color: string;
}

const CustomHomeIcon: React.FC<CustomIconProps> = ({ color }) => (
  <Image
    source={require('../../assets/images/HomePage.png')}
    style={{ tintColor: color, width: 24, height: 24 } as StyleProp<ImageStyle>}
  />
);

export default CustomHomeIcon;