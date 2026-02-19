import { usePushNotifications } from '@/hooks/usePushNotifications';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { UPDATE_LOCATION_API } from '../apis/login';
import CustomSplashScreen from '../components/SplashScreen';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
    const { loading, isAuthenticated, user } = useAuth();
    const router = useRouter();
    usePushNotifications(); // Register for push notifications

    useEffect(() => {
        if (!loading) {
            // Give the user a moment to appreciate the premium splash screen
            const timeout = setTimeout(async () => {
                if (isAuthenticated) {
                    // Update location in background
                    try {
                        let { status } = await Location.requestForegroundPermissionsAsync();
                        if (status === 'granted') {
                            let location = await Location.getCurrentPositionAsync({});
                            if (user?.token) {
                                await UPDATE_LOCATION_API({
                                    latitude: location.coords.latitude,
                                    longitude: location.coords.longitude,
                                    token: user.token
                                });
                            }
                        }
                    } catch (error) {
                        console.log("Error updating location on app open:", error);
                    }

                    // @ts-ignore
                    router.replace('/(tabs)');
                } else {
                    // @ts-ignore
                    router.replace('/(auth)/login');
                }
            }, 2500); // 2.5 seconds delay

            return () => clearTimeout(timeout);
        }
    }, [loading, isAuthenticated, user]);

    return <CustomSplashScreen />;
}
