import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';

export default function AuthLayout() {
    const { theme } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors[theme].background },
                animation: 'slide_from_right',
                gestureEnabled: true
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="reset-password" />
        </Stack>
    );
}
