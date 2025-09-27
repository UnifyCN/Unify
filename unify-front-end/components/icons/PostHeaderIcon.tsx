import React from 'react';
import Svg, { Path } from 'react-native-svg';

const ChevronRight = ({ width = 6, height = 10, color = "#9F9D9D" }) => (
  <Svg width={width} height={height} viewBox="0 0 6 10" fill="none">
    <Path 
      d="M1 9L5 5L1 1" 
      stroke={color} 
      strokeLinejoin="round" 
    />
  </Svg>
);

export default ChevronRight;