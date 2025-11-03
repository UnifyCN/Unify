import { Stack } from 'expo-router';

export default function LearnStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none', // Disable all transitions
      }}
    />
  );
}
