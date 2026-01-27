import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/Theme';

type Props = {
  size?: number; // tamaño en px
  color?: string; // color de relleno
};

export default function StarFilled({ size = 32, color = Theme.primaryGatherRed }: Props) {
  return (
    <Svg
      width={size}
      height={(size * 41) / 43} // mantiene proporción del SVG original
      viewBox='0 0 43 41'
      fill='none'
    >
      <Path
        d='M21.0359 33.673L31.2379 39.8434C33.1063 40.9743 35.3925 39.3026 34.9009 37.1884L32.1967 25.5851L41.2188 17.7676C42.8658 16.3418 41.9809 13.6376 39.8175 13.4655L27.9438 12.4576L23.2975 1.49344C22.4617 -0.497812 19.61 -0.497812 18.7742 1.49344L14.1279 12.433L2.25419 13.4409C0.0908539 13.613 -0.794147 16.3172 0.852937 17.743L9.87502 25.5605L7.17085 37.1639C6.67919 39.278 8.96544 40.9497 10.8338 39.8189L21.0359 33.673Z'
        fill={color}
      />
    </Svg>
  );
}
