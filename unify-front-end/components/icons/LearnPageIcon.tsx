import React from 'react';
import { Image} from 'react-native';
import SVGLearnIcon from '@/assets/images/LearnPage.svg';
import SVGLearnFocusedIcon from '@/assets/images/LearnPageFocused.svg';

interface CustomIconProps {
  name: string;
  color: string;
  focused: boolean;
}

const icon = {
  focused: require('@/assets/images/LearnPageFocused.svg'),
  default: require('@/assets/images/LearnPage.svg'),
};

export default function CustomLearnIcon({
  name,
  color,
  focused
}: CustomIconProps) {
  return (
    <>
      {focused ? <SVGLearnFocusedIcon fill={color}/> : <SVGLearnIcon fill={color}/>}
    </>
  )
}