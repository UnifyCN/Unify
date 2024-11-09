import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

import CustomHomeIcon from "@/components/icons/HomePageIcon";
import CustomLearnIcon from "@/components/icons/LearnPageIcon";
import CustomProfileIcon from "@/components/icons/ProfilePageIcon";

import { tabLayoutStyles } from "./styles/LayoutStyles";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "dark"].tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={tabLayoutStyles.tabContainer}>
              <CustomHomeIcon color={color} focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="Learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color, focused }) => (
            <View style={tabLayoutStyles.tabContainer}>
              <CustomLearnIcon color={color} focused={focused} />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={tabLayoutStyles.tabContainer}>
              <CustomProfileIcon color={color} focused={focused} />
            </View>
          )
        }}
      />
    </Tabs>
  );
}