import { updateLocationApi } from '@/apis/profile';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import CustomSplashScreen from '../components/splashScreen';
import { useAuth } from '../context/AuthContext';
import { clientStorage } from '@/utils/storage';

export default function SplashScreen() {
    const { loading, isAuthenticated, user } = useAuth();
    const router = useRouter();
    const [showSplash, setShowSplash] = useState<boolean | null>(null);

    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const onboardingCompleted = await clientStorage.getItem('onboarding_completed');
                if (onboardingCompleted !== 'true') {
                    setShowSplash(false);
                    router.replace('/onboarding' as any);
                } else {
                    setShowSplash(true);
                }
            } catch (error) {
                console.log("Error checking onboarding status:", error);
                setShowSplash(true); // Fallback to splash
            }
        };

        checkOnboarding();
    }, []);

    useEffect(() => {
        if (!loading && showSplash === true) {
            const timeout = setTimeout(async () => {
                try {
                    if (isAuthenticated) {
                        router.replace('/(drawer)/(tabs)' as any);
                    } else {
                        router.replace('/(auth)/login');
                    }
                } catch (error) {
                    console.log("Error in splash flow:", error);
                    router.replace('/(auth)/login');
                }
            }, 1000);

            return () => clearTimeout(timeout);
        }
    }, [loading, isAuthenticated, user, showSplash]);

    if (showSplash === null) return null;
    if (showSplash === false) return null;

    return <CustomSplashScreen />;
}
