import { Stack } from 'expo-router';

export default function LearnLayOut() {
    return (
        <Stack
            screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{title: "Learn"}} />
        </Stack>
    )
}