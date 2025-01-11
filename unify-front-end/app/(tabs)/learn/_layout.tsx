import { Stack } from 'expo-router';

export default function LearnLayOut() {
    return (
        <Stack
            screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{title: "Learn"}} />
            <Stack.Screen name="in-progress" options={{title: "In Progress"}} />
            <Stack.Screen name="lesson-library" />
            Stack.Screen name=""
        </Stack>
    )
}