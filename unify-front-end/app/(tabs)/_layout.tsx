import React from "react";
import { Tabs } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

import CustomNavBar from "@/components/navigation/CustomBottomNavBar";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "dark"].tint,
        headerShown: false,
      }}
      tabBar={(props) => <CustomNavBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="Learn/index"
        options={{
          title: "Learn",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
      <Tabs.Screen name="Learn/modules" options={{ href: null }} />
      <Tabs.Screen name="Learn/journey-map" options={{ href: null }} />
    </Tabs>
  );
}
