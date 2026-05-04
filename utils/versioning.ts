/**
 * Compares two semantic version strings (e.g., "1.0.0" and "1.1.0").
 * @param {string} v1 - Version 1
 * @param {string} v2 - Version 2
 * @returns {number} 1 if v1 > v2, -1 if v1 < v2, 0 if v1 === v2
 */
export const compareVersions = (v1: string, v2: string): number => {
    if (!v1 || !v2) return 0;

    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const p1 = v1Parts[i] || 0;
        const p2 = v2Parts[i] || 0;

        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }

    return 0;
};

/**
 * Checks if an update is required or suggested based on semantic versions.
 * @param {string} currentVersion - Current version of the app
 * @param {string} latestVersion - Latest version from the backend
 * @param {string} minRequiredVersion - Minimum required version from the backend
 * @returns {{ isMandatory: boolean; isOptional: boolean }} Update status
 */
export const checkUpdateStatus = (
    currentVersion: string,
    latestVersion: string,
    minRequiredVersion: string
) => {
    const isMandatory = compareVersions(currentVersion, minRequiredVersion) < 0;
    const isOptional = compareVersions(currentVersion, latestVersion) < 0 && !isMandatory;

    return { isMandatory, isOptional };
};
