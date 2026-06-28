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
    const [minTimeElapsed, setMinTimeElapsed] = useState<boolean>(false);

    useEffect(() => {
        // Enforce a minimum display time of 2.2 seconds to allow splash animations to complete
        const timer = setTimeout(() => setMinTimeElapsed(true), 2200);
        return () => clearTimeout(timer);
    }, []);

    const navigateNext = async () => {
        setShowSplash(false);
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
        // Only navigate when auth checking is done AND the minimum time has passed
        if (!loading && showSplash && minTimeElapsed) {
            navigateNext();
        }
    }, [loading, showSplash, minTimeElapsed]);

    if (!showSplash) return null;

    return <CustomSplashScreen />;
}
