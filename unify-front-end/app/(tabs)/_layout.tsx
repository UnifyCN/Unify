import React, { useState } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { HIDDEN_TAB_BAR_ROUTES } from '@/constants/Routes';
import { useColorScheme } from '@/hooks/useColorScheme';
import { View, Text, StyleSheet } from 'react-native';
import HomeIcon from '@/components/icons/HomePageIcon';
import LearnIcon from '@/components/icons/LearnPageIcon';
import CommunityIcon from '@/components/icons/CommunityIcon';
import ClickedHomeIcon from '@/components/icons/ClickedHomeIcon';
import ClickedLearnIcon from '@/components/icons/ClickedLearnIcon';
import CompanionIcon from '@/components/icons/CompanionIcon';

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
  const pathname = usePathname();
  const [currentTab, setCurrentTab] = useState('index');

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'dark'].tint,
          tabBarShowLabel: false,
          headerShown: false,
          tabBarStyle: HIDDEN_TAB_BAR_ROUTES.some(route =>
            pathname.includes(route)
          )
            ? { display: 'none' }
            : {
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
          name='Gather'
          options={{
            title: 'Community',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                IconComponent={CommunityIcon}
                title='Community'
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name='companion'
          options={{
            title: 'Companion',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                IconComponent={CompanionIcon}
                title='Companion'
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
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
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
