import React from 'react';
import { Svg, Rect, Ellipse } from 'react-native-svg';

interface GiftBoxIconProps {
  size?: number;
}

/**
 * Stylized gift box — yellow body, red ribbon, simple flat-ish look that
 * stays readable at small sizes. Drawn inline (no asset file) so it scales
 * cleanly and animates via React Native transforms.
 */
export function GiftBoxIcon({ size = 40 }: GiftBoxIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 64 64'
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'
      aria-hidden
      focusable={false}
      role='presentation'
    >
      {/* ground shadow */}
      <Ellipse cx='32' cy='59' rx='22' ry='2.2' fill='rgba(0,0,0,0.10)' />

      {/* box body (left light, right darker for depth) */}
      <Rect x='10' y='28' width='44' height='28' rx='2' fill='#F5C24A' />
      <Rect x='46' y='28' width='8' height='28' fill='#E5A82F' />

      {/* lid */}
      <Rect x='6' y='22' width='52' height='10' rx='2' fill='#FFD25C' />
      <Rect x='50' y='22' width='8' height='10' fill='#F5C24A' />

      {/* vertical ribbon */}
      <Rect x='28' y='22' width='8' height='34' fill='#E94B4B' />

      {/* horizontal ribbon highlight where lid meets body */}
      <Rect x='6' y='30' width='52' height='2' fill='#C73838' opacity='0.35' />

      {/* bow — two loops with darker inner spots for depth */}
      <Ellipse cx='22' cy='16' rx='8' ry='6' fill='#E94B4B' />
      <Ellipse cx='42' cy='16' rx='8' ry='6' fill='#E94B4B' />
      <Ellipse cx='22' cy='16' rx='3.5' ry='2.5' fill='#B73030' />
      <Ellipse cx='42' cy='16' rx='3.5' ry='2.5' fill='#B73030' />

      {/* bow knot */}
      <Rect x='28' y='12' width='8' height='9' rx='1.5' fill='#F66A6A' />
    </Svg>
  );
}
