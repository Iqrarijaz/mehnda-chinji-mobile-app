import apiClient from './client';

export interface AppVersionInfo {
    latestVersion: string;
    minRequiredVersion: string;
    updateUrl: {
        android: string;
        ios: string;
    };
    releaseNotes: string;
    isMandatory: boolean;
}

/**
 * Fetches the latest app version information from the backend.
 * @returns {Promise<AppVersionInfo>} App version metadata
 */
export const fetchAppVersionInfo = async (): Promise<AppVersionInfo> => {
    try {
        const type = 'APP_VERSION';
        const response: any = await apiClient.get(`/api/public/v1/configuration/${type}`);
        return response.data?.data || response.data;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch app version info');
    }
};
