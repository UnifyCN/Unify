import React, { useState, useRef } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { HIDDEN_TAB_BAR_ROUTES } from '@/constants/Routes';
import { useColorScheme } from '@/hooks/useColorScheme';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import HomeIcon from '@/components/icons/HomePageIcon';
import LearnIcon from '@/components/icons/LearnPageIcon';
import CommunityIcon from '@/components/icons/CommunityIcon';
import ClickedHomeIcon from '@/components/icons/ClickedHomeIcon';
import ClickedLearnIcon from '@/components/icons/ClickedLearnIcon';
import CompanionIcon from '@/components/icons/CompanionIcon';
import { useAnalytics } from '@/utils/analytics';
import ChecklistIcon from '@/components/icons/ChecklistIcon';
import { useHapticsPreference } from '@/context/HapticsContext';

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
  const previousTabRef = useRef('index');
  const { trackTabSwitch } = useAnalytics();
  const { hapticsEnabled } = useHapticsPreference();

  // Map route names to display names
  const getTabDisplayName = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return 'Home';
      case 'Gather':
        return 'Community';
      case 'companion':
        return 'Companion';
      case 'Checklist':
        return 'Checklist';
      case 'Learn':
        return 'Learn';
      default:
        return routeName;
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme === 'light' ? 'light' : 'dark'].tint,
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
            const routeName = e.target?.split('-')[0] || 'index';
            const isTabSwitch = routeName !== previousTabRef.current;

            if (isTabSwitch && hapticsEnabled) {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            // Track tab switch
            if (isTabSwitch) {
              trackTabSwitch(
                getTabDisplayName(previousTabRef.current),
                getTabDisplayName(routeName)
              );
              previousTabRef.current = routeName;
            }

            if (routeName === 'Gather') {
              // If already on Gather tab, prevent re-navigation animation
              if (currentTab === 'Gather') {
                e.preventDefault();
                // Only navigate if deep in the Gather stack (not on main screen)
                const isOnMainGatherScreen =
                  pathname === '/Gather/gather' || pathname === '/Gather';
                if (!isOnMainGatherScreen) {
                  router.replace('/(tabs)/Gather/gather');
                }
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
          name='Checklist'
          options={{
            title: 'Checklist',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                IconComponent={ChecklistIcon}
                title='Checklist'
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
