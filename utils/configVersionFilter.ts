import * as Application from 'expo-application';
import Constants from 'expo-constants';

export interface VersionFilterableItem {
    id?: string;
    isActive?: boolean;
    appVersions?: string[];
    order?: number;
    [key: string]: any;
}

/**
 * The version this build reports, used to evaluate `appVersions` gates.
 *
 * Native binary first, then the bundled env value, then the version declared in
 * app.json. That last step used to be a hardcoded "2.0.8": harmless while the
 * app really was 2.0.8, but the moment the release is bumped a build that
 * cannot read its own version would claim to be the old one and show — or hide
 * — the wrong version-gated sections. Reading expoConfig keeps it honest,
 * because that is the same value the release is built from.
 */
export function getCurrentAppVersion(): string {
    return (
        Application.nativeApplicationVersion ||
        process.env.EXPO_PUBLIC_APP_VERSION ||
        Constants.expoConfig?.version ||
        ''
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
