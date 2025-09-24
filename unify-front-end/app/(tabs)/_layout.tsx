import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Header from '@/components/Header';
import { useRouter } from 'expo-router';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeIcon from '@/components/icons/HomePageIcon';
import LearnIcon from '@/components/icons/LearnPageIcon';
import GatherIcon from '@/components/icons/GatherPageIcon';

const TabIcon = ({IconComponent, title, focused}: any) => {
  return (
    <View style={styles.tab}>
      <IconComponent 
        height = {styles.tabIcon.height}
        width = {styles.tabIcon.width}
        color={focused ? styles.activeTab.color : styles.inactiveTab.color} 
      />
      <Text style={styles.tabText}>
        {title}
      </Text>
    </View>
  )
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <>
    <Header
      onProfilePress={() => router.push('/(tabs)/Gather/Profile/profile')}
    />
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
        }
      }}
    >
      <Tabs.Screen
          name='index'
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                IconComponent = {HomeIcon}
                title = 'Home'
                focused = {focused}
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
                IconComponent = {LearnIcon}
                title = 'Learn'
                focused = {focused}
              />
            ),
          }}
        />
      <Tabs.Screen
        name='Gather'
        options={{
          title: 'Gather',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
                IconComponent = {GatherIcon}
                title = 'Gather'
                focused = {focused}
              />
          ),
        }}
      />
      {/* Hide non-tab routes from appearing as tabs */}
      <Tabs.Screen name='profile' options={{ href: null }} />
      <Tabs.Screen name='profile-blank' options={{ href: null }} />
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
    textAlign: 'center',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tabIcon: {
    height: 24,
    width: 24,
    paddingVertical: 2,
    paddingHorizontal: 3
  },
  activeTab: {
    color: '#000'
  },
  inactiveTab: {
    color: '#878787'
  }
});