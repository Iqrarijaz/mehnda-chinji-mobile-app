// import analytics from '@react-native-firebase/analytics';
import { useEffect, useRef } from 'react';
import { useSegments, usePathname } from 'expo-router';

/**
 * ScreenTracker provides utilities for tracking navigation.
 */
export const trackScreen = async (screenName: string) => {
    try {
        // await analytics().logScreenView({
        //     screen_name: screenName,
        //     screen_class: screenName,
        // });

        if (__DEV__) {
            console.log(`📱 [Analytics] Screen View: ${screenName}`);
        }
    } catch (error) {
        if (__DEV__) {
            console.error('❌ [Analytics] Screen tracking failed', error);
        }
    }
};

/**
 * Hook for automated screen tracking in Expo Router.
 */
export const useScreenTracking = () => {
    const segments = useSegments();
    const pathname = usePathname();
    const prevPathname = useRef<string | null>(null);

    useEffect(() => {
        // Only track if the pathname actually changed
        if (pathname !== prevPathname.current) {
            // Construct a readable screen name from segments
            const screenName = segments.length > 0 ? `/${segments.join('/')}` : 'Home';

            trackScreen(screenName);
            prevPathname.current = pathname;
        }
    }, [segments, pathname]);
};
