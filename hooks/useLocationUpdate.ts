import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { updateLocationApi } from '@/apis/profile';
import { useAuth } from '@/context/AuthContext';
import { clientStorage, StorageKeys } from '@/utils/storage';

export const useLocationUpdate = () => {
    // Location updates disabled as requested
    /*
    const { isAuthenticated, updateUser } = useAuth();
    const appState = useRef(AppState.currentState);

    const updateLocation = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const lastUpdate = await clientStorage.getItem(StorageKeys.LAST_LOCATION_UPDATE);

            if (lastUpdate === today) return;

            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Low,
            });

            const response = await updateLocationApi({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            }) as any;

            if (response?.success) {
                if (response.data) {
                    await updateUser(response.data);
                }
                await clientStorage.setItem(StorageKeys.LAST_LOCATION_UPDATE, today);
            }
        } catch (error) {
            console.error('❌ Failed to update location:', error);
        }
    }, [isAuthenticated, updateUser]);

    useEffect(() => {
        if (isAuthenticated) {
            updateLocation();
        }

        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                updateLocation();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [isAuthenticated, updateLocation]);
    */

};
