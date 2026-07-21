import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { useWeatherCity } from '@/context/WeatherContext';
import { getCurrentCoords, Coordinates } from '@/utils/locationService';
import { capitalizeString } from '@/utils/string';
import { useSavedCities } from '@/hooks/useSavedCities';

interface WeatherLocation {
    /** Current-location coordinates when permission is granted, else null. */
    coords: Coordinates | null;
    /** City name to use when coordinates are unavailable (profile city → selected city). */
    fallbackCity: string;
}

let globalCachedCoords: Coordinates | null = null;

/**
 * Resolves the location the home weather widget should display:
 *   - current GPS location when location permission is already granted, else
 *   - the user's profile city, else the app's selected/default city.
 *
 * Never prompts for permission itself — the post-login location flow owns the
 * prompt — so the widget simply reflects whatever permission the user granted.
 * Re-checks whenever the home screen regains focus (permission/services may have
 * changed in system settings).
 */
export function useWeatherLocation(): WeatherLocation {
    const { user } = useAuth();
    const { selectedCity } = useWeatherCity();
    const { defaultCity } = useSavedCities();
    const [coords, setCoords] = useState<Coordinates | null>(globalCachedCoords);

    const profileCity = user?.user?.city
        ? `${capitalizeString(user.user.city)}, PK`
        : selectedCity;

    const resolveCoords = useCallback(async () => {
        const current = await getCurrentCoords({ requestPermission: false });
        setCoords((prev) => {
            if (!current) {
                globalCachedCoords = prev === null ? prev : null;
                return globalCachedCoords;
            }
            // Round to ~100m so GPS jitter doesn't churn state / re-render.
            const next = {
                latitude: Number(current.latitude.toFixed(3)),
                longitude: Number(current.longitude.toFixed(3)),
            };
            if (prev && prev.latitude === next.latitude && prev.longitude === next.longitude) {
                return prev;
            }
            globalCachedCoords = next;
            return next;
        });
    }, []);

    useEffect(() => {
        resolveCoords();
    }, [resolveCoords]);

    useFocusEffect(
        useCallback(() => {
            resolveCoords();
        }, [resolveCoords]),
    );

    // Current GPS wins. If it's unavailable, fall back to the user's Default
    // saved City (by its coordinates, for accuracy), then the profile city.
    const effectiveCoords: Coordinates | null =
        coords ?? (defaultCity ? { latitude: defaultCity.latitude, longitude: defaultCity.longitude } : null);
    const fallbackCity = coords ? profileCity : (defaultCity?.name || profileCity);

    return { coords: effectiveCoords, fallbackCity };
}
