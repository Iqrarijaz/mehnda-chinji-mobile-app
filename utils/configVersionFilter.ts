import * as Application from 'expo-application';

export interface VersionFilterableItem {
    id?: string;
    isActive?: boolean;
    appVersions?: string[];
    order?: number;
    [key: string]: any;
}

/**Valid@123
 * Returns the client application version string (e.g. "2.0.8").
 */
export function getCurrentAppVersion(): string {
    return (
        Application.nativeApplicationVersion ||
        process.env.EXPO_PUBLIC_APP_VERSION ||
        '2.0.8'
    );
}

/**
 * Checks if a config item is active and supported for the current app version.
 * - If isActive is explicitly false -> returns false.
 * - If appVersions is empty array, undefined, or null -> returns true for all versions.
 * - If appVersions contains versions -> returns true only if current version matches.
 */
export function isItemActiveAndSupported(
    item: VersionFilterableItem,
    currentVersion: string = getCurrentAppVersion()
): boolean {
    if (item.isActive === false) return false;
    if (!item.appVersions || !Array.isArray(item.appVersions) || item.appVersions.length === 0) {
        return true;
    }
    return item.appVersions.includes(currentVersion);
}
