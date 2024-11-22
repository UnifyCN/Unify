import { View, TouchableOpacity, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import CustomHomeIcon from "../icons/HomePageIcon";
import CustomLearnIcon from "../icons/LearnPageIcon";
import CustomProfileIcon from "../icons/ProfilePageIcon";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import React from "react";

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

        // Handle specific case for Learn/index
        if (label === "Learn/index") {
          label = "Learn";
        }

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
            {isFocused && (
              <Animated.Text style={styles.text}>
                {label as string}
              </Animated.Text>
            )}
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
      Learn: (
        <CustomLearnIcon name={"Learn"} color={color} focused={isFocused} />
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
    flexDirection: "row",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    width: 377,
    alignSelf: "center",
    bottom: 40,
    height: 52,
    borderRadius: 99,
    paddingTop: 4,
    paddingRight: 5,
    paddingBottom: 4,
    paddingLeft: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  tabItem: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    gap: 8,
    paddingHorizontal: 30,
    borderRadius: 999,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#000000",
    marginLeft: 8,
  },
});

export default CustomNavBar;
