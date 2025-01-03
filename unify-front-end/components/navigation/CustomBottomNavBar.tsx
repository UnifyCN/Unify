import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import CustomHomeIcon from "../icons/HomePageIcon";
import CustomlearnIcon from "../icons/LearnPageIcon";
import CustomProfileIcon from "../icons/ProfilePageIcon";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import React from "react";

// For future animation implementations if needed
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const CustomNavBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        // console.log(route);

        if (
          [
            "_sitemap",
            "+not-found",
            "Learn/modules",
            "Learn/journey-map",
            "Learn/module/in-progress",
            "Learn/module/lesson-library",
            "Learn/In-progress",
            "Learn/Lesson-library",
            "Learn/Main-lesson",
            "Learn/moduleComponents/lesson-library",
            "Learn/moduleComponents/index",
            "Learn/moduleComponents/in-progress",
            "Learn/Lessons/path-way-finance",
            "Learn/moduleComponents/lesson-completed",
            "Learn/moduleComponents/quiz-screen",
            "Learn/moduleComponents/main-lesson",
            "Learn/Lessons/PathWayFinanceSubTopics/budgeting",
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

        return (
          <AnimatedTouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[
              styles.tabItem,
              { backgroundColor: isFocused ? "#E7E7E9" : "transparent" },
            ]}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <View style={styles.iconWrapper}>
              {getIconByRouteName(
                route.name,
                isFocused ? "#000000" : "#5C5C5C",
                isFocused
              )}
            </View>
            <Text style={{color: isFocused? "#000000" : "#5C5C5C"}}>
              {label}
            </Text>
            {/* {isFocused && (
              <Text style={styles.text}>
                {label as string}
              </Text>
            )} */}
          </AnimatedTouchableOpacity>
        );
      })}
    </View>
  );

  function getIconByRouteName(
    routeName: string,
    color: string,
    isFocused: boolean
  ): React.ReactNode {
    const iconMap: Record<string, React.ReactNode> = {
      index: <CustomHomeIcon name={"Home"} color={color} focused={isFocused} />,
      "Learn/index": (
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
    bottom: 25,
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
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderCurve: "continuous",
    gap: 8,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#000000",
  },
});

export default CustomNavBar;
