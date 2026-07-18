import { clientStorage } from '@/utils/storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function IndexScreen() {
    const { loading, isAuthenticated } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();

    const navigateNext = async () => {
        try {
            const onboardingCompleted = await clientStorage.getItem('onboarding_completed');

            if (onboardingCompleted !== 'true') {
                router.replace('/onboarding' as any);
                return;
            }

            if (isAuthenticated) {
                router.replace('/(drawer)/(tabs)' as any);
            } else {
                router.replace('/(auth)/login');
            }
        } catch (error) {
            if (__DEV__) console.log("Error in splash flow:", error);
            router.replace('/(auth)/login');
        }
    };

    useEffect(() => {
        // Only navigate when auth checking is done
        if (!loading) {
            navigateNext();
        }
    }, [loading]);

    // Blank view matching the splash background so the splash fade-out lands
    // on the same color instead of flashing white
    return <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#0F172A' : '#E6F4FE' }} />;
}
