import React from 'react';
import { Svg, Path } from 'react-native-svg';

const ClickedGatherIcon = ({ width = 21, height = 18, color = "#000", focused = false}) => (
  <Svg width={width} height={height} viewBox="0 0 21 18" fill="none">
    <Path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M16.9941 0.801034C19.0891 2.02203 20.5631 4.50103 20.4981 7.39303C20.3601 13.5 12.0001 18 10.5001 18C9.00007 18 0.639068 13.5 0.502068 7.39303C0.437068 4.50103 1.91107 2.02303 4.00607 0.801034C5.96607 -0.339966 8.42807 -0.346966 10.5001 1.33803C12.5721 -0.346966 15.0341 -0.340966 16.9941 0.801034Z"
      fill={color}
    />
  </Svg>
);

export default ClickedGatherIcon;