import React from 'react';
import { Feather } from '@expo/vector-icons';

interface CustomIconProps {
  name: string;
  color: string;
  focused: boolean;
}

export default function CustomGatherIcon({
  name,
  color,
  focused,
}: CustomIconProps) {
  return <Feather name='heart' size={24} color={color} />;
}
