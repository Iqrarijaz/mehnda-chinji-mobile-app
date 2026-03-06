import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
// import { MMKV } from 'react-native-mmkv';

// Check if we can use MMKV (fails in Expo Go)
const isMMKVAvailable = () => {
    /*
    try {
        const test = new MMKV();
        return true;
    } catch (e) {
        return false;
    }
    */
    return false;
};

const mmkv = null; // isMMKVAvailable() ? new MMKV() : null;

if (!mmkv) {
    // console.warn('MMKV is not available (likely Expo Go). Falling back to AsyncStorage.');
}

/**
 * Enhanced clientStorage that works with React Query's persister
 * and handles the MMKV/AsyncStorage fallback.
 */
export const clientStorage = {
    setItem: async (key: string, value: string) => {
        if (mmkv) {
            mmkv.set(key, value);
        } else {
            await AsyncStorage.setItem(key, value);
        }
        return true;
    },
    getItem: async (key: string) => {
        if (mmkv) {
            return mmkv.getString(key) || null;
        } else {
            return await AsyncStorage.getItem(key);
        }
    },
    removeItem: async (key: string) => {
        if (mmkv) {
            mmkv.delete(key);
        } else {
            await AsyncStorage.removeItem(key);
        }
    },
};

/**
 * Secure storage for sensitive data like auth tokens.
 */
export const secureStorage = {
    setItem: async (key: string, value: string) => {
        try {
            await SecureStore.setItemAsync(key, value);
            return true;
        } catch (e) {
            console.error(`[SecureStorage] Failed to set item: ${key}`, e);
            return false;
        }
    },
    getItem: async (key: string) => {
        try {
            return await SecureStore.getItemAsync(key);
        } catch (e) {
            console.error(`[SecureStorage] Failed to get item: ${key}`, e);
            return null;
        }
    },
    removeItem: async (key: string) => {
        try {
            await SecureStore.deleteItemAsync(key);
            return true;
        } catch (e) {
            console.error(`[SecureStorage] Failed to remove item: ${key}`, e);
            return false;
        }
    },
};

export const StorageKeys = {
    CONVERSATIONS: 'conversations_cache',
};

/**
 * Async helper to get parsed data from storage
 */
export const getStorageData = async <T>(key: string): Promise<T | null> => {
    try {
        const value = await clientStorage.getItem(key);
        if (value) {
            return JSON.parse(value);
        }
        return null;
    } catch (e) {
        console.error(`[Storage] Failed to get data for key: ${key}`, e);
        return null;
    }
};

/**
 * Async helper to set stringified data in storage
 */
export const setStorageData = async (key: string, value: any) => {
    try {
        await clientStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`[Storage] Failed to set data for key: ${key}`, e);
    }
};
