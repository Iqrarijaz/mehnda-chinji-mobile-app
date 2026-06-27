import { clientStorage } from '@/utils/storage';
import { useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import CustomSplashScreen from '@/components/splashScreen';
import { useAuth } from '../context/AuthContext';
import { useAdsStore } from '../store/ads.store';

export default function SplashScreen() {
    const { loading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [showSplash, setShowSplash] = useState<boolean>(true);

    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const onboardingCompleted = await clientStorage.getItem('onboarding_completed');
                if (onboardingCompleted !== 'true') {
                    setShowSplash(false);
                    router.replace('/onboarding' as any);
                }
            } catch (error) {
                if (__DEV__) console.log("Error checking onboarding status:", error);
            }
        };

        checkOnboarding();
    }, []);

    const navigateNext = () => {
        setShowSplash(false);
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
    };

    useEffect(() => {
        if (!loading && showSplash) {
            navigateNext();
        }
    }, [loading, showSplash]);

    if (!showSplash) return null;

    return <CustomSplashScreen />;
}
