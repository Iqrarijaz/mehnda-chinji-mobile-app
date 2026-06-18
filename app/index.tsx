import { clientStorage } from '@/utils/storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import CustomSplashScreen from '@/components/splashScreen';
import { useAuth } from '../context/AuthContext';
import { useAdsStore } from '../store/ads.store';

export default function SplashScreen() {
    const { loading, isAuthenticated, user } = useAuth();
    const router = useRouter();
    const [showSplash, setShowSplash] = useState<boolean>(true);
    const isShowingAppOpen = useAdsStore(state => state.isShowingAppOpen);
    const [hasAttemptedAd, setHasAttemptedAd] = useState(false);

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

    // Trigger navigation when the ad is closed or finished showing
    useEffect(() => {
        if (!loading && showSplash && !isShowingAppOpen && hasAttemptedAd) {
            navigateNext();
        }
    }, [loading, showSplash, isShowingAppOpen, hasAttemptedAd]);

    useEffect(() => {
        if (!loading && showSplash === true && !hasAttemptedAd) {
            const timeout = setTimeout(async () => {
                setHasAttemptedAd(true);
                
                const isAdLoaded = useAdsStore.getState().isAdLoaded.appOpen;
                let adShown = false;

                if (isAdLoaded) {
                    try {
                        const { default: AppOpenService } = await import('@/ads/appOpen.service');
                        adShown = await AppOpenService.getInstance().show(false);
                    } catch (error) {
                        console.error("Failed to show App Open ad:", error);
                    }
                }

                if (!adShown) {
                    navigateNext();
                }
            }, 2000);

            return () => clearTimeout(timeout);
        }
    }, [loading, isAuthenticated, user, showSplash, hasAttemptedAd]);

    if (!showSplash) return null;

    return <CustomSplashScreen />;
}
