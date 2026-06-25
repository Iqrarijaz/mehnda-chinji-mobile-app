import { clientStorage } from '@/utils/storage';
import { useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
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

    const isAdLoaded = useAdsStore(state => state.isAdLoaded.appOpen);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Effect to start loading and set a max timeout
    useEffect(() => {
        if (!loading && showSplash && !hasAttemptedAd) {
            // Trigger load in case it hasn't started yet
            import('@/ads/appOpen.service').then(({ default: AppOpenService }) => {
                AppOpenService.getInstance().load();
            }).catch(err => console.error('Failed to preload ad:', err));

            // Set max timeout to wait for ad load (e.g. 5 seconds)
            timeoutRef.current = setTimeout(() => {
                console.log('[Splash] Ad load timeout reached, transitioning...');
                setHasAttemptedAd(true);
            }, 5000);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [loading, showSplash]);

    // Effect to watch when the ad loads and show it
    useEffect(() => {
        if (!loading && showSplash && isAdLoaded && !hasAttemptedAd) {
            console.log('[Splash] Ad loaded! Presenting App Open ad...');
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            
            setHasAttemptedAd(true);

            import('@/ads/appOpen.service').then(async ({ default: AppOpenService }) => {
                const shown = await AppOpenService.getInstance().show(false);
                if (!shown) {
                    navigateNext();
                }
            }).catch(err => {
                console.error('[Splash] Failed to show ad:', err);
                navigateNext();
            });
        }
    }, [loading, showSplash, isAdLoaded, hasAttemptedAd]);

    // Transition effect once ad is attempted and not showing
    useEffect(() => {
        if (!loading && showSplash && !isShowingAppOpen && hasAttemptedAd) {
            navigateNext();
        }
    }, [loading, showSplash, isShowingAppOpen, hasAttemptedAd]);

    if (!showSplash) return null;

    return <CustomSplashScreen />;
}
