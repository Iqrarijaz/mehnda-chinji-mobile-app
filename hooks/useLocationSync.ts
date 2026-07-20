import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';

import { useAuth } from '@/context/AuthContext';
import { useNotificationStore } from '@/store/notificationStore';
import { clientStorage } from '@/utils/storage';
import moment from '@/utils/dayjs';
import { updateLocation } from '@/apis/profile';

const LAST_LOCATION_SYNC_KEY = 'last_location_sync_v1';

// Refresh once or twice per day, or when the user has moved a meaningful distance.
const MIN_SYNC_INTERVAL_HOURS = 12;
const SIGNIFICANT_DISTANCE_METERS = 1000;

// Small delay so the location prompt doesn't collide with the login flow or the
// push-notification permission prompt.
const INITIAL_SYNC_DELAY_MS = 4000;

type SyncInfo = { lat: number; lng: number; at: string };

/**
 * Great-circle distance between two coordinates, in meters.
 */
const distanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
};

/**
 * Requests location permission (after login, non-blocking), syncs the user's
 * coordinates to the backend at most once or twice a day (or on a significant
 * move), and reports whether the coordinate-based weather flow is active.
 *
 * When it returns `locationActive: true`, the app should rely on the backend's
 * direct (coordinate-based) weather push and unsubscribe from the city weather
 * topic to avoid duplicate notifications. When `false` (permission denied,
 * services off, or any failure), the app keeps the existing topic-based weather
 * flow driven by the user's profile city.
 */
export function useLocationSync(): { locationActive: boolean } {
    const { isAuthenticated } = useAuth();
    const weatherEnabled = useNotificationStore((state) => state.preferences?.weather);
    const [locationActive, setLocationActive] = useState(false);
    const inFlightRef = useRef(false);

    useEffect(() => {
        if (!isAuthenticated) {
            setLocationActive(false);
            return;
        }

        let cancelled = false;

        const syncLocation = async () => {
            if (inFlightRef.current) return;
            inFlightRef.current = true;
            try {
                // 1. Check current permission without prompting.
                const current = await Location.getForegroundPermissionsAsync();
                let status = current.status;

                // 2. Prompt only if the user hasn't decided yet (and can be asked).
                if (status !== Location.PermissionStatus.GRANTED && current.canAskAgain) {
                    const requested = await Location.requestForegroundPermissionsAsync();
                    status = requested.status;
                }

                if (status !== Location.PermissionStatus.GRANTED) {
                    // Denied / restricted → keep topic-based fallback.
                    if (!cancelled) setLocationActive(false);
                    return;
                }

                // 3. Location services must actually be enabled on the device.
                const servicesEnabled = await Location.hasServicesEnabledAsync();
                if (!servicesEnabled) {
                    if (!cancelled) setLocationActive(false);
                    return;
                }

                // Permission is granted: coordinate flow is active regardless of
                // whether we end up writing this cycle.
                if (!cancelled) setLocationActive(true);

                // 4. Throttle: skip the network call when we synced recently and
                //    haven't moved far.
                const raw = await clientStorage.getItem(LAST_LOCATION_SYNC_KEY);
                const last: SyncInfo | null = raw ? JSON.parse(raw) : null;

                const position = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                const { latitude, longitude } = position.coords;

                if (last) {
                    const hoursSince = moment().diff(moment(last.at), 'hour', true);
                    const moved = distanceMeters(last.lat, last.lng, latitude, longitude);
                    if (hoursSince < MIN_SYNC_INTERVAL_HOURS && moved < SIGNIFICANT_DISTANCE_METERS) {
                        // Recent and nearby — nothing worth sending.
                        return;
                    }
                }

                // 5. Send coordinates to the backend.
                await updateLocation({ latitude, longitude });
                await clientStorage.setItem(
                    LAST_LOCATION_SYNC_KEY,
                    JSON.stringify({ lat: latitude, lng: longitude, at: moment().toISOString() }),
                );
            } catch (error) {
                // Any failure → fall back to the existing profile-city flow.
                if (__DEV__) console.warn('📍 Location sync failed:', error);
                if (!cancelled) setLocationActive(false);
            } finally {
                inFlightRef.current = false;
            }
        };

        const timer = setTimeout(syncLocation, INITIAL_SYNC_DELAY_MS);

        // Re-evaluate when the app returns to the foreground — the user may have
        // toggled the permission or location services in system settings.
        const appStateSub = AppState.addEventListener('change', (state) => {
            if (state === 'active') syncLocation();
        });

        return () => {
            cancelled = true;
            clearTimeout(timer);
            appStateSub.remove();
        };
        // weatherEnabled is included so we re-check when the user toggles weather.
    }, [isAuthenticated, weatherEnabled]);

    return { locationActive };
}
