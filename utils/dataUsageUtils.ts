/**
 * Format bytes to readable string (e.g., 1.2 MB, 500 KB)
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Get numerical value and unit separately for advanced UI styling
 */
export const splitBytes = (bytes: number, decimals: number = 1) => {
    if (bytes === 0) return { value: '0', unit: 'B' };

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return {
        value: (bytes / Math.pow(k, i)).toFixed(dm),
        unit: sizes[i]
    };
};
