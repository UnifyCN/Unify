import { useScrollContext } from "@/context/ScrollContext";
import Animated, { Easing, useAnimatedStyle, useDerivedValue, withTiming} from "react-native-reanimated";

export const useScrollVisibility = () => {
    const [scrollValue] = useScrollContext()

    const visibilityProgress = useDerivedValue(
        () => withTiming(scrollValue.value > 0.5 ? 1: 0, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        })
    , [scrollValue])

    return visibilityProgress;
}