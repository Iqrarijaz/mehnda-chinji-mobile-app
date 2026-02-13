import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import CustomSplashScreen from '../components/SplashScreen';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
    const { loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            // Give the user a moment to appreciate the premium splash screen
            const timeout = setTimeout(() => {
                if (isAuthenticated) {
                    // @ts-ignore
                    router.replace('/(tabs)');
                } else {
                    // @ts-ignore
                    router.replace('/(auth)/welcome');
                }
            }, 2500); // 2.5 seconds delay

            return () => clearTimeout(timeout);
        }
    }, [loading, isAuthenticated]);

    return <CustomSplashScreen />;
}
