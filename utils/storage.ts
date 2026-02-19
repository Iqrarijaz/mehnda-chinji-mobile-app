
// Fallback storage implementation
const createStorage = () => {
    try {
        return new MMKV();
    } catch (e) {
        console.warn('Failed to initialize MMKV. Using in-memory fallback. IF YOU ARE IN DEV, REBUILD YOUR APP.');
        return {
            getString: () => null,
            set: () => { },
            delete: () => { },
            clearAll: () => { },
            // Add other methods as needed to satisfy interface or usage
        };
    }
};

export const storage = createStorage();

export const clientStorage = {
    setItem: (key: string, value: string) => {
        storage.set(key, value);
        return Promise.resolve(true);
    },
    getItem: (key: string) => {
        const value = storage.getString(key);
        return Promise.resolve(value);
    },
    removeItem: (key: string) => {
        storage.delete(key);
        return Promise.resolve();
    },
};

export const StorageKeys = {
    CONVERSATIONS: 'conversations_cache',
};

export const getStorageData = <T>(key: string): T | null => {
    try {
        const json = storage.getString(key);
        if (json) {
            return JSON.parse(json);
        }
        return null;
    } catch (e) {
        console.error('Failed to get storage data', e);
        return null;
    }
};

export const setStorageData = (key: string, value: any) => {
    try {
        storage.set(key, JSON.stringify(value));
    } catch (e) {
        console.error('Failed to set storage data', e);
    }
};
