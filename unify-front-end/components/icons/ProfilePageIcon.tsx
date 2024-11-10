import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface CustomIconProps {
  name: string;
  color: string;
}

const CustomProfileIcon: React.FC<CustomIconProps> = ({ color }) => (
  <Image
    source={require('../../assets/images/ProfilePage.png')}
    style={{ tintColor: color, width: 24, height: 24 } as StyleProp<ImageStyle>}
  />
);

export default CustomProfileIcon;