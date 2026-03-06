import { updateLocationApi } from '@/apis/profile';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import CustomSplashScreen from '../components/splashScreen';
import { useAuth } from '../context/AuthContext';
import { clientStorage } from '@/utils/storage';

export default function SplashScreen() {
    const { loading, isAuthenticated, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            const timeout = setTimeout(async () => {
                try {
                    // For testing: always show onboarding
                    if (true) { // onboardingCompleted !== 'true'
                        router.replace('/onboarding' as any);
                        return;
                    }

                    if (isAuthenticated) {
                        try {
                            let { status } = await Location.requestForegroundPermissionsAsync();
                            if (status === 'granted') {
                                let location = await Location.getCurrentPositionAsync({});
                                await updateLocationApi({
                                    latitude: location.coords.latitude,
                                    longitude: location.coords.longitude,
                                });
                            }
                        } catch (error) {
                            console.log("Error updating location on app open:", error);
                        }
                        router.replace('/(tabs)');
                    } else {
                        router.replace('/(auth)/login');
                    }
                } catch (error) {
                    console.log("Error checking onboarding status:", error);
                    router.replace('/(auth)/login');
                }
            }, 1000);

            return () => clearTimeout(timeout);
        }
    }, [loading, isAuthenticated, user]);

    return <CustomSplashScreen />;
}
