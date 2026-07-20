import * as Location from 'expo-location';

/**
 * Shared location helpers for the reusable LocationPicker and form auto-capture.
 * Uses only free services: device GPS (expo-location) + OpenStreetMap / Nominatim
 * for search and reverse geocoding. No Google Maps APIs.
 */

export interface PlaceResult {
    displayName: string;
    latitude: number;
    longitude: number;
}

export interface Coordinates {
    latitude: number;
    longitude: number;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// A descriptive identifier is requested by the Nominatim usage policy.
const REQUEST_HEADERS = {
    'User-Agent': 'RehbarCommunityApp/1.0 (support@mehndachinji.com)',
    'Accept-Language': 'en',
};

export const isValidCoordinate = (lat?: number | null, lng?: number | null): boolean => {
    return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180 &&
        !(lat === 0 && lng === 0)
    );
};

/**
 * Search places/addresses via Nominatim. Returns [] on failure.
 */
export const searchPlaces = async (query: string): Promise<PlaceResult[]> => {
    const q = query.trim();
    if (q.length < 3) return [];

    try {
        const url =
            `${NOMINATIM_BASE}/search?format=json&addressdetails=1&limit=8` +
            `&countrycodes=pk&q=${encodeURIComponent(q)}`;

        const res = await fetch(url, { headers: REQUEST_HEADERS });
        if (!res.ok) return [];

        const data = await res.json();
        if (!Array.isArray(data)) return [];

        return data
            .map((item: any) => ({
                displayName: item.display_name as string,
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
            }))
            .filter((p: PlaceResult) => isValidCoordinate(p.latitude, p.longitude));
    } catch (error) {
        if (__DEV__) console.warn('📍 Nominatim search failed:', error);
        return [];
    }
};

/**
 * Reverse geocode coordinates to a human-readable label via Nominatim.
 * Returns null on failure.
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<string | null> => {
    if (!isValidCoordinate(latitude, longitude)) return null;

    try {
        const url =
            `${NOMINATIM_BASE}/reverse?format=json&zoom=16&addressdetails=1` +
            `&lat=${latitude}&lon=${longitude}`;

        const res = await fetch(url, { headers: REQUEST_HEADERS });
        if (!res.ok) return null;

        const data = await res.json();
        return (data?.display_name as string) || null;
    } catch (error) {
        if (__DEV__) console.warn('📍 Nominatim reverse geocode failed:', error);
        return null;
    }
};

/**
 * Capture the device's current GPS coordinates.
 *
 * @param options.requestPermission When true (default), prompt for permission if
 *   not yet granted. When false, only use an already-granted permission (used for
 *   silent auto-capture on form submit so the user is never blocked by a prompt).
 * @returns Coordinates, or null when permission is denied / services are off / it fails.
 */
/**
 * Resolve the coordinates to attach to a create/edit submission.
 * - Uses the manually selected location when present.
 * - Otherwise silently captures the current location IF permission is already
 *   granted (never prompts at submit time, so the user is never blocked).
 * - Returns null when nothing is available, so the record is saved without
 *   coordinates.
 */
export const resolveLocationForSubmit = async (
    manual?: Coordinates | null,
): Promise<Coordinates | null> => {
    if (manual && isValidCoordinate(manual.latitude, manual.longitude)) {
        return { latitude: manual.latitude, longitude: manual.longitude };
    }
    return getCurrentCoords({ requestPermission: false });
};

export const getCurrentCoords = async (
    options: { requestPermission?: boolean } = {},
): Promise<Coordinates | null> => {
    const { requestPermission = true } = options;

    try {
        const current = await Location.getForegroundPermissionsAsync();
        let status = current.status;

        if (status !== Location.PermissionStatus.GRANTED) {
            if (!requestPermission || !current.canAskAgain) return null;
            const requested = await Location.requestForegroundPermissionsAsync();
            status = requested.status;
        }

        if (status !== Location.PermissionStatus.GRANTED) return null;

        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) return null;

        const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = position.coords;
        if (!isValidCoordinate(latitude, longitude)) return null;

        return { latitude, longitude };
    } catch (error) {
        if (__DEV__) console.warn('📍 getCurrentCoords failed:', error);
        return null;
    }
};
