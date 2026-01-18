import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

type StarProps = {
  size?: number;
  filled?: boolean;
  color?: string;
};

export default function Star({
  size = 32,
  filled = false,
  color = '#B4B1B1',
}: StarProps) {
  return (
    <Svg
      width={size}
      height={(size * 41) / 43} // mantiene proporción
      viewBox="0 0 43 41"
      fill="none"
    >
      <Path
        d="M19.6963 1.88086C20.1891 0.70689 21.8822 0.70689 22.375 1.88086L22.377 1.88379L27.0234 12.8477L27.8594 13.4541L39.7334 14.4619H39.7383C41.0114 14.5632 41.545 16.1629 40.5645 17.0117H40.5635L31.542 24.8291L31.2227 25.8125L33.9268 37.415C34.2189 38.6716 32.8634 39.6584 31.7559 38.9883V38.9873L21.5537 32.8174L20.5195 32.8164L10.3174 38.9619L10.3164 38.9629C9.24359 39.6122 7.93737 38.7073 8.12207 37.5078L8.14453 37.3906L10.8486 25.7871L10.5303 24.8047L1.50781 16.9873C0.527382 16.1386 1.06017 14.5391 2.33301 14.4375H2.33887L14.2129 13.4297L15.0488 12.8242L19.6943 1.88477L19.6963 1.88086Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="bevel"
        fill={filled ? color : 'none'}
      />
    </Svg>
  );
}
