import React from 'react';
import { Image} from 'react-native';
import SVGLearnPageIcon from '@/assets/images/LearnPage.svg';
import SVGLearnPageFocusedIcon from '@/assets/images/LearnPageFocused.svg';

interface CustomIconProps {
  name: string;
  color: string;
  focused: boolean;
}

export default function CustomLearnIcon({
  name,
  color,
  focused
}: CustomIconProps) {
  return (
    <>
      {focused ? <SVGLearnPageFocusedIcon fill={color}/> : <SVGLearnPageIcon fill={color}/>}
    </>
  )
}