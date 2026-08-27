/**
 * Qibla geometry.
 *
 * Pure functions, deliberately kept free of React and expo-location so they can
 * be reasoned about and tested on their own. Getting these wrong means pointing
 * someone the wrong way for prayer, so they are worth isolating.
 */

/** The Kaaba, Masjid al-Haram, Mecca. */
export const KAABA = { latitude: 21.4225, longitude: 39.8262 } as const;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Great-circle initial bearing from (lat1,lon1) to (lat2,lon2).
 * Returns 0-360°, where 0 is true north.
 *
 * The initial bearing of a great circle is the correct answer for Qibla: it is
 * the shortest path over the sphere. A constant-compass-heading (rhumb line)
 * route would look sensible on a flat map but is not the direction of the Kaaba.
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaLambda = toRad(lon2 - lon1);
    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Great-circle distance in km between two coordinates (haversine). */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaPhi = toRad(lat2 - lat1);
    const deltaLambda = toRad(lon2 - lon1);
    const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Shortest signed angular delta from `current` to `target`, in [-180, 180).
 *
 * The half-open end matters: an exact half-turn returns -180, never +180. Both
 * are geometrically correct for antipodal angles, and the dial lands in the
 * same place either way -- it just always takes that turn anticlockwise.
 */
export function shortestAngleDelta(target: number, current: number): number {
    return ((((target - current) % 360) + 540) % 360) - 180;
}

/** Bearing and distance from a position to the Kaaba. */
export function qiblaFrom(latitude: number, longitude: number): { bearing: number; distanceKm: number } {
    return {
        bearing: calculateBearing(latitude, longitude, KAABA.latitude, KAABA.longitude),
        distanceKm: calculateDistanceKm(latitude, longitude, KAABA.latitude, KAABA.longitude),
    };
}

/** How far off Qibla the device currently points, in degrees (0-180). */
export function alignmentOffset(qiblaBearing: number, deviceHeading: number): number {
    return Math.abs(shortestAngleDelta(qiblaBearing, deviceHeading));
}

/** Within this many degrees counts as "facing the Qibla". */
export const ALIGNMENT_THRESHOLD_DEG = 4;

/**
 * Compass-point label for a bearing ("NE", "SSW", …). Used to give the numeric
 * bearing a plain-language companion.
 */
const COMPASS_POINTS = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
] as const;

export function compassPoint(bearing: number): string {
    const normalized = ((bearing % 360) + 360) % 360;
    return COMPASS_POINTS[Math.round(normalized / 22.5) % 16];
}

/** Distance formatted for display, with thousands separators. */
export function formatDistance(km: number): string {
    return `${Math.round(km).toLocaleString()} km`;
}
