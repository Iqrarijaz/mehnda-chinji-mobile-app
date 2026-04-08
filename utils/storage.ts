import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Enhanced clientStorage that uses AsyncStorage.
 * Methods are kept async to maintain compatibility with React Query and Zustand persistence.
 */
export const clientStorage = {
    setItem: async (key: string, value: string): Promise<void> => {
        await AsyncStorage.setItem(key, value);
    },
    getItem: async (key: string): Promise<string | null> => {
        return await AsyncStorage.getItem(key);
    },
    removeItem: async (key: string): Promise<void> => {
        await AsyncStorage.removeItem(key);
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
    LAST_LOCATION_UPDATE: 'last_location_update',
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
