import { Stack } from 'expo-router';

export default function CommunityMatchingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: '#111827',
        },
        headerShadowVisible: false,
        headerTintColor: '#111827',
      }}
    >
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen name='onboarding' options={{ headerShown: false }} />
      <Stack.Screen name='waiting-room' options={{ headerShown: false }} />
      <Stack.Screen
        name='complete-onboarding'
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='circle/[circleId]/index'
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='circle/[circleId]/chat'
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
