import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { secureStorage, clientStorage } from '@/utils/storage';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { useNotificationStore } from '@/store/notificationStore';
import { tokenCache } from '@/lib/tokenCache';

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
                    // Populate in-memory cache immediately — interceptor uses this from now on
                    if (parsed.token) tokenCache.set(parsed.token);
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
        // Cache token in memory — interceptor reads from here, no more disk I/O per request
        if (authData.token) tokenCache.set(authData.token);
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
            analyticsService.trackEvent(AnalyticsEvents.LOGOUT);
            await clientStorage.removeItem('push_token');
        } catch (error) {
            console.error('Error during logout cleanup:', error);
        }

        // Clear in-memory token immediately so in-flight retries don't send a stale token
        tokenCache.clear();
        setUser(null);
        await secureStorage.removeItem('userData');
        // @ts-ignore
        router.replace('/(auth)/login');
    }, [router]);

    const updateUser = useCallback(async (payload: any) => {
        // Extract nested data if present
        const source = payload.data || payload;
        const newUserData = source.userData || (source.id ? source : source.user) || source;

        if (!newUserData || typeof newUserData !== 'object') {
            console.error('Invalid update data:', payload);
            return;
        }

        setUser(prev => {
            if (!prev) return prev;

            const finalUserData = { ...prev.user, ...newUserData };

            if (finalUserData.notificationPreferences) {
                initializePreferences(finalUserData.notificationPreferences);
            }

            const updatedAuthData = { ...prev, user: finalUserData };
            secureStorage.setItem('userData', JSON.stringify(updatedAuthData));
            return updatedAuthData;
        });
    }, [initializePreferences]);

    const isAuthenticated = !!user;

    // Protect routes
    useEffect(() => {
        if (loading) return;

        const rootSegment = segments[0] as string | undefined;
        // Whitelist routes that are accessible without authentication
        const publicRoutes = ['onboarding', 'terms', 'privacy', 'communityGuidelines', 'weather'];
        const isPublicRoute = !rootSegment || rootSegment === 'index' || publicRoutes.includes(rootSegment);

        const inAuthGroup = rootSegment === '(auth)';

        if (!user && !inAuthGroup && !isPublicRoute) {
            // Redirect unauthenticated users to login if they try to access protected routes
            // @ts-ignore
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            // Redirect authenticated users to the main app if they end up in auth screens
            // @ts-ignore
            router.replace('/(drawer)/(tabs)');
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
