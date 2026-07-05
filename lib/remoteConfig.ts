import { getRemoteConfig, setConfigSettings, setDefaults, fetchAndActivate, getValue } from '@react-native-firebase/remote-config';
import { baseUrl as fallbackUrl } from '@/configs';

/**
 * Remote Config Service
 * 
 * Manages dynamic configuration values from Firebase.
 * Primarily used for controlling the API Base URL remotely.
 */

let API_URL = fallbackUrl;

export const initConfig = async () => {
    try {
        const configKey = __DEV__ ? 'dev_api_base_url' : 'prod_api_url';
        const rc = getRemoteConfig();

        // Set the fetch interval. In development, we want instant updates (0).
        // In production, we usually use a higher value (e.g., 3600 seconds / 1 hour).
        const minimumFetchIntervalMillis = __DEV__ ? 0 : 3600000;
        await setConfigSettings(rc, {
            minimumFetchIntervalMillis,
        });

        // Set default values – crucial for reliability
        await setDefaults(rc, {
            [configKey]: fallbackUrl,
        });

        // Fetch and activate the latest values from the server
        await fetchAndActivate(rc);

        // Always attempt to update from the latest activated configuration
        const fetchedUrl = getValue(rc, configKey).asString();
        if (fetchedUrl && fetchedUrl.startsWith('http')) {
            API_URL = fetchedUrl;
        }

        if (__DEV__) {
            console.log(`🌐 [RemoteConfig] Current URL: ${API_URL}`);
        }
    } catch (error) {
        console.warn('⚠️ [RemoteConfig] Failed to initialize, using fallback:', error);
        API_URL = fallbackUrl;
    }
};

/**
 * Returns the current API Base URL.
 * Should be used by apis/client.ts instead of importing the static config.
 */
export const getApiUrl = () => API_URL;
