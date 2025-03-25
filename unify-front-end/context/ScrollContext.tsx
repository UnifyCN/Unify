import React, { createContext, useContext } from "react";
import { Easing,type SharedValue, useSharedValue, withTiming } from 'react-native-reanimated'

type ScrollContextTuple = [SharedValue<number>, () => void]
// The inital value doesn't do anything since we pretty much always use useContext with the context provider 
// but it's good for reader to understand the type, I suppose 

const ScrollContext = createContext<ScrollContextTuple>(null!);

export const useScrollContext = () => useContext(ScrollContext)

export const ScrollContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const scrollValue = useSharedValue(0);
    // We can then call handleReset to reset the animation to default state if required
    // For example maybe after exiting a page, for UI purposes, u can reset it back instead of keep it in hiding
    const handleReset = () => {
        scrollValue.value = withTiming(0, {duration: 150, easing: Easing.out(Easing.cubic)})
    }
    return (
        <ScrollContext.Provider value={[scrollValue, handleReset]}>
            {children}
        </ScrollContext.Provider>
    )
}