import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { secureStorage, clientStorage } from '@/utils/storage';
import { useNotificationStore } from '@/store/notificationStore';

type UserData = {
    token: string;
    user: any;
} | null;

interface AuthContextType {
    user: UserData;
    loading: boolean;
    login: (data: any) => void;
    logout: () => void;
    updateUser: (data: any) => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: () => { },
    logout: () => { },
    updateUser: async () => { },
    isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserData>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();
    const { initializePreferences } = useNotificationStore();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUser = await secureStorage.getItem('userData');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed);
                    if (parsed.user?.notificationPreferences) {
                        initializePreferences(parsed.user.notificationPreferences);
                    }
                }
            } catch (e) {
                console.error('Failed to load user', e);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = useCallback(async (payload: any) => {
        // Handle nested data if present
        const source = payload.data || payload;
        const userData = source.userData || (source.id ? source : null);

        if (!userData) {
            console.error('Invalid login data - userData not found');
            return;
        }

        const authData = { user: userData, token: source.token || payload.token };
        setUser(authData);

        if (userData.notificationPreferences) {
            initializePreferences(userData.notificationPreferences);
        }

        await secureStorage.setItem('userData', JSON.stringify(authData));

        // @ts-ignore
        router.replace('/(tabs)/');
    }, [router, initializePreferences]);

    const logout = useCallback(async () => {
        try {
            // ⭐ Phase 5: Logout Cleanup
            console.log('🚪 Starting logout cleanup...');
            await clientStorage.removeItem('push_token');
            console.log('✅ Logout cleanup completed (Push token cleared).');
        } catch (error) {
            console.error('Error during logout cleanup:', error);
        }

        setUser(null);
        await secureStorage.removeItem('userData');
        // @ts-ignore
        router.replace('/(auth)/login');
    }, [router]);

    const updateUser = useCallback(async (newUserData: any) => {
        setUser(prev => {
            if (!prev) return prev;

            if (newUserData.notificationPreferences) {
                initializePreferences(newUserData.notificationPreferences);
            }

            const updatedAuthData = { ...prev, user: { ...prev.user, ...newUserData } };
            secureStorage.setItem('userData', JSON.stringify(updatedAuthData));
            return updatedAuthData;
        });
    }, [initializePreferences]);

    const isAuthenticated = !!user;

    // Protect routes
    useEffect(() => {
        if (loading) return;

        // @ts-ignore
        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            // @ts-ignore
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            // @ts-ignore
            router.replace('/(tabs)/');
        }
    }, [user, loading, segments]);

    const authValue = useMemo(() => ({
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated
    }), [user, loading, login, logout, updateUser, isAuthenticated]);

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
