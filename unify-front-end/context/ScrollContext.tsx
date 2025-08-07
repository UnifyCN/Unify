import React, { createContext, useContext } from 'react';
import {
  Easing,
  type SharedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type ScrollContextTuple = [SharedValue<number>, () => void];

const ScrollContext = createContext<ScrollContextTuple | undefined>(undefined);

export const useScrollContext = () => {
  const context = useContext(ScrollContext);

  if (!context) {
    throw new Error(
      'useScrollContext must be used within a ScrollContextProvider'
    );
  }

  return context;
};

export const ScrollContextProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const scrollValue = useSharedValue(0);
  // We can then call handleReset to reset the animation to default state if required
  // For example maybe after exiting a page, for UI purposes, u can reset it back instead of keep it in hiding
  const handleReset = () => {
    scrollValue.value = withTiming(0, {
      duration: 150,
      easing: Easing.out(Easing.cubic),
    });
  };
  return (
    <ScrollContext.Provider value={[scrollValue, handleReset]}>
      {children}
    </ScrollContext.Provider>
  );
};
