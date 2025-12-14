import { Stack } from 'expo-router';

export default function CommunityMatchingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='index' />
      <Stack.Screen name='onboarding' />
      <Stack.Screen name='waiting-room' />
      <Stack.Screen name='complete-onboarding' />
      <Stack.Screen name='circle/[circleId]/index' />
      <Stack.Screen name='circle/[circleId]/chat' />
    </Stack>
  );
}
