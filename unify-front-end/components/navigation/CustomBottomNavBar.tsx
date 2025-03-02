import { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Text, LayoutChangeEvent } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useScrollContext } from "@/context/ScrollContext";
import CustomHomeIcon from "../icons/HomePageIcon";
import CustomlearnIcon from "../icons/LearnPageIcon";
import CustomProfileIcon from "../icons/ProfilePageIcon";
import Animated, { Easing, useAnimatedStyle, useDerivedValue, withTiming} from "react-native-reanimated";
import React from "react";

// For future animation implementations if needed
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const CustomNavBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  insets,
}) => {
  const [height, setHeight] = useState(0);
  const [scrollValue] = useScrollContext();
  const shownAmount = useDerivedValue(
    () => withTiming(scrollValue.value > 0.5 ? 1: 0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    })
  )
  
  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: shownAmount.value * (height * 1.5)}]
    })
  )

  const handleLayout = (e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height);

  return (
    <Animated.View 
      style={[
        styles.container,
        animatedStyle,
        ]} 
      onLayout={handleLayout}>

      {state.routes.map((route, index) => {
        if (
          [
            "_sitemap",
            "+not-found",
          ].includes(route.name)
        )
          return null;

        const { options } = descriptors[route.key];
        let label = String(
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name
        );

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        const primaryColor = "#2F97C4";
        const whiteColor = "#FFFFFF"
        return (
          <AnimatedTouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[
              styles.tabItem,
              { backgroundColor: isFocused ? primaryColor : whiteColor },
            ]}
            accessibilityRole="button"
            accessibilityLabel={label}
          >

            {getIconByRouteName(
              route.name,
              isFocused ? whiteColor : primaryColor,
              isFocused
            )}
            <Text style={{color: isFocused? whiteColor : primaryColor}}>
              {label}
            </Text>
          </AnimatedTouchableOpacity>
        );
      })}
    </Animated.View>
  );

  function getIconByRouteName(
    routeName: string,
    color: string,
    isFocused: boolean
  ): React.ReactNode {
    const iconMap: Record<string, React.ReactNode> = {
      index: <CustomHomeIcon name={"Home"} color={color} focused={isFocused} />,
      learn: (
        <CustomlearnIcon name={"Learn"} color={color} focused={isFocused} />
      ),
      profile: (
        <CustomProfileIcon name={"Profile"} color={color} focused={isFocused} />
      ),
    };

    return (
      iconMap[routeName] || (
        <CustomHomeIcon name="Home" color={color} focused={isFocused} />
      )
    );
  }
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    flexDirection: "row",
    backgroundColor: "#fff",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "center",
    flexShrink: 0,
    bottom: 15,
    width: 365,
    height: 50,
    borderRadius: 25,
    borderCurve: "continuous",
    paddingHorizontal: 4,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderCurve: "continuous",
    gap: 8,
  },
  text: {
    color: "#000000",
  },
});

export default CustomNavBar;
