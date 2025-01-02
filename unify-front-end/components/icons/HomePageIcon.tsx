import React from "react";
import { View, Image, ImageStyle, StyleProp } from "react-native";

interface CustomIconProps {
  name: string;
  color: string;
  focused: boolean;
}

// const CustomHomeIcon: React.FC<CustomIconProps> = ({ color, focused }) => (
//   <Image
//     source={
//       focused
//         ? require("@/assets/images/HomePageFocused.svg")
//         : require("@/assets/images/HomePage.svg")
//     }
//     style={{ tintColor: color, width: 24, height: 24 } as StyleProp<ImageStyle>}
//   />
// );

// export default CustomHomeIcon;
// Optimize for performance by only render the icon once
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
      style={{ tintColor: color }}
    />
  )
}