import React, { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Header from '@/components/Header';
import { View, Text, StyleSheet } from 'react-native';
import HomeIcon from '@/components/icons/HomePageIcon';
import LearnIcon from '@/components/icons/LearnPageIcon';
import GatherIcon from '@/components/icons/GatherPageIcon';
import ClickedHomeIcon from '@/components/icons/ClickedHomeIcon';
import ClickedLearnIcon from '@/components/icons/ClickedLearnIcon';
import ClickedGatherIcon from '@/components/icons/ClickedGatherIcon';

const TabIcon = ({ IconComponent, title, focused }: any) => {
  return (
    <View style={styles.tab}>
      <IconComponent
        height={styles.tabIcon.height}
        width={styles.tabIcon.width}
        color={focused ? styles.activeTab.color : styles.inactiveTab.color}
      />
      <Text
        style={[
          styles.tabText,
          focused ? styles.activeTab : styles.inactiveTab,
        ]}
      >
        {title}
      </Text>
    </View>
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('index');

  return (
    <>
      <Header />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'dark'].tint,
          tabBarShowLabel: false,
          headerShown: false,
          tabBarStyle: {
            flexDirection: 'row',
            paddingTop: 12,
            paddingBottom: 52,
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
          },
        }}
        screenListeners={{
          tabPress: e => {
            const routeName = e.target?.split('-')[0];
            if (routeName === 'Gather') {
              // If already on Gather tab, replace to main screen
              if (currentTab === 'Gather') {
                router.replace('/(tabs)/Gather/gather');
              }
              // Update current tab state
              setCurrentTab('Gather');
            } else {
              // Update current tab state for other tabs
              setCurrentTab(routeName || 'index');
            }
          },
        }}
      >
        <Tabs.Screen
          name='index'
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                IconComponent={focused ? ClickedHomeIcon : HomeIcon}
                title='Home'
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name='Learn'
          options={{
            title: 'Learn',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                IconComponent={focused ? ClickedLearnIcon : LearnIcon}
                title='Learn'
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name='Gather'
          options={{
            title: 'Gather',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                IconComponent={focused ? ClickedGatherIcon : GatherIcon}
                title='Gather'
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tab: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 4,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 9,
    flexShrink: 0,
  },
  tabText: {
    fontSize: 10,
    fontFamily: 'Inter',
  },
  tabIcon: {
    height: 24,
    width: 24,
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  activeTab: {
    color: '#000',
  },
  inactiveTab: {
    color: '#878787',
  },
});
