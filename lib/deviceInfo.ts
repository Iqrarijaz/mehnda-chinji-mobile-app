import * as Application from 'expo-application';
import * as Network from 'expo-network';
import { Platform } from 'react-native';

interface DeviceInfoCache {
    deviceId: string;
    networkType: string;
    localIp: string;
    initialized: boolean;
}

const cache: DeviceInfoCache = {
    deviceId: 'unknown',
    networkType: 'unknown',
    localIp: '',
    initialized: false,
};

export async function initializeDeviceInfo(): Promise<void> {
    try {
        if (Platform.OS === 'ios') {
            cache.deviceId = (await Application.getIosIdForVendorAsync()) || 'unknown';
        } else if (Platform.OS === 'android') {
            cache.deviceId = (Application as any).androidId || 'unknown';
        }
    } catch (e) {
        console.error('initializeDeviceInfo: failed to get deviceId', e);
    }

    try {
        const networkState = await Network.getNetworkStateAsync();
        cache.networkType = networkState.type || 'unknown';
        cache.localIp = (await Network.getIpAddressAsync()) || '';
    } catch (e) {
        console.error('initializeDeviceInfo: failed to get network state', e);
    }

    cache.initialized = true;
}

export async function refreshNetworkInfo(): Promise<void> {
    try {
        const networkState = await Network.getNetworkStateAsync();
        cache.networkType = networkState.type || 'unknown';
        cache.localIp = (await Network.getIpAddressAsync()) || '';
    } catch (e) {
        console.error('refreshNetworkInfo: failed', e);
    }
}

export function getDeviceInfo() {
    return cache;
}
